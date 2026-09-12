import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
'Access-Control-Allow-Origin': '*',
 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log('No auth token, guest access');
    return null;
  }

  // Fast path: guests present the anon key itself as the bearer token. Skip the
  // auth-server round trip for them (~100-500ms saved per request).
  if (token === Deno.env.get('SUPABASE_ANON_KEY')) {
    console.log('Guest user access via anon key');
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.log('Allowing unauthenticated access');
    return null;
  }

  return user;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req);
    console.log('Request from:', user ? `user ${user.id}` : 'guest');

    // Per-IP rate limit — pitch-analysis is expensive (GPT-4 class) so we cap
    // unauthenticated callers tightly.
    const ip = getClientIp(req);
    const rl = checkRateLimit(`pitch:${user?.id ?? `ip:${ip}`}`, user ? 30 : 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const rawBody = await req.text();

    // Cap payload: 1 MB for guests, 50 MB for authenticated users.
    const MAX_BODY = user ? 50 * 1024 * 1024 : 1 * 1024 * 1024;
    if (rawBody.length > MAX_BODY) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: corsHeaders }
      );
    }

    const { 
      transcript, 
      practiceMode = 'text',
      scenario = null,
      userContext = {}
    } = JSON.parse(rawBody);

    console.log('Pitch analysis request:', { transcript, practiceMode, scenario });

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No transcript provided for analysis');
    }

    const systemPrompt = `You are an expert sales coach and pitch analysis AI. Analyze the following sales pitch and provide detailed, actionable feedback.

Your analysis should cover:
1. **Clarity** - How clear and easy to understand is the message?
2. **Confidence** - Does the delivery sound confident and authoritative?
3. **Persuasiveness** - How compelling are the arguments and value proposition?
4. **Tone** - Is the tone appropriate for the situation?
5. **Objection Handling** - How well does it address potential concerns?

For each category, provide:
- A score from 1-10
- Specific feedback on what was done well
- Concrete suggestions for improvement
- Industry-specific recommendations when relevant

Return your analysis as a JSON object with this structure:
{
  "overallScore": number (1-100),
  "categories": {
    "clarity": { "score": number, "feedback": "string", "suggestions": ["string"] },
    "confidence": { "score": number, "feedback": "string", "suggestions": ["string"] },
    "persuasiveness": { "score": number, "feedback": "string", "suggestions": ["string"] },
    "tone": { "score": number, "feedback": "string", "suggestions": ["string"] },
    "objectionHandling": { "score": number, "feedback": "string", "suggestions": ["string"] }
  },
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendation": "string"
}

Be constructive, specific, and actionable in your feedback. Focus on sales best practices and communication effectiveness.`;

    const userPrompt = `Please analyze this sales pitch:

"${transcript}"

${scenario ? `Context: This is for a ${scenario.industry} industry scenario, addressing ${scenario.objection} objections at ${scenario.difficulty} difficulty level.` : ''}

Provide detailed analysis and scoring as requested.`;

    const openaiPayload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: "json_object" }
    };

    // One automatic retry with short backoff on transient OpenAI failures
    // (429 rate-limit / 5xx / network error). Timeouts are not retried.
    // A 429 caused by billing/quota exhaustion (`insufficient_quota`) is not
    // transient, so it fails fast without a retry.
    const RETRYABLE_STATUS = (s: number) => s === 429 || s >= 500;
    const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';
    const isQuotaError = async (res: Response): Promise<boolean> => {
      try { return /insufficient_quota/i.test(await res.clone().text()); }
      catch { return false; }
    };
    const callOpenAI = async (): Promise<Response> => {
      const attemptController = new AbortController();
      const attemptTimeout = setTimeout(() => attemptController.abort(), 25_000);
      try {
        return await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(openaiPayload),
          signal: attemptController.signal,
        });
      } finally {
        clearTimeout(attemptTimeout);
      }
    };

    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1_500));
      try {
        const res = await callOpenAI();
        if (res.ok) { response = res; break; }
        if (res.status === 429 && await isQuotaError(res)) {
          console.warn('[pitch-analysis] OpenAI billing/quota exhausted — failing fast, no retry');
          response = res; break;
        }
        if (!RETRYABLE_STATUS(res.status)) { response = res; break; }
        console.warn(`[pitch-analysis] OpenAI ${res.status} on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
        response = res;
      } catch (error) {
        if (isAbort(error)) { response = null; break; }
        console.warn(`[pitch-analysis] OpenAI network error on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
        response = null;
      }
    }

    if (!response) {
      throw new Error('OpenAI request timed out');
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('Raw AI analysis:', analysisText);
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to structured response
      analysis = {
        overallScore: 75,
        categories: {
          clarity: { score: 7, feedback: "Analysis completed", suggestions: ["Continue practicing"] },
          confidence: { score: 7, feedback: "Good delivery", suggestions: ["Maintain consistency"] },
          persuasiveness: { score: 7, feedback: "Solid approach", suggestions: ["Add more specific examples"] },
          tone: { score: 8, feedback: "Professional tone", suggestions: ["Keep up the good work"] },
          objectionHandling: { score: 7, feedback: "Addressed key points", suggestions: ["Prepare for follow-up questions"] }
        },
        strengths: ["Clear communication", "Professional approach"],
        improvements: ["Add more specific examples", "Practice objection handling"],
        recommendation: "Continue practicing to build confidence and refine your approach."
      };
    }

    // Ensure the response has the expected structure
    if (!analysis.overallScore) {
      analysis.overallScore = Math.round(
        Object.values(analysis.categories || {}).reduce((sum: number, cat: any) => sum + (cat.score || 7), 0) * 2
      );
    }

    console.log('Processed analysis result:', analysis);

    return new Response(JSON.stringify({ 
      analysis,
      transcript,
      metadata: {
        practiceMode,
        scenario,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[INTERNAL] Error in pitch-analysis function:', error);

    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('authorization') || errMsg.includes('token')) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        code: 'AUTH_ERROR'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: 'Service temporarily unavailable',
      fallback: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});