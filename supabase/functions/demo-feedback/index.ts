import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Optional authentication: returns user if authenticated, null if guest
const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log('No auth token provided - proceeding as guest user');
    return null; // Guest user
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('Invalid auth token - proceeding as guest user');
      return null; // Invalid token, treat as guest
    }
    return user; // Authenticated user
  } catch (error) {
    console.log('Auth verification error - proceeding as guest user:', error);
    return null; // Error during auth, treat as guest
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional authentication - supports both authenticated and guest users
    const user = await verifyAuth(req);
    const isGuest = user === null;

    if (isGuest) {
      console.log('Processing demo feedback for guest user');
    } else {
      console.log('Processing demo feedback for authenticated user:', user.id);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { response, inputType } = await req.json();

    // Input validation
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response format');
    }
    if (response.length < 10) {
      throw new Error('Response too short (minimum 10 characters)');
    }
    if (response.length > 1000) {
      throw new Error('Response too long (maximum 1000 characters)');
    }

    // Sanitize input - remove control characters and trim
    const sanitizedResponse = response
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim()
      .substring(0, 1000);

    console.log('Demo feedback request:', {
      responseLength: sanitizedResponse.length,
      inputType,
      userId: isGuest ? 'guest' : user.id,
      isGuest
    });

    const systemPrompt = `You are a tough but fair sales coach. You give honest, direct feedback — not empty praise.

CRITICAL RULES:
- NEVER say "good start", "great effort", "nice try", or similar praise for weak responses.
- If a response abandons the sale, concedes defeat, ignores the objection, or fails to assert value, SAY SO CLEARLY. Give it a low score (1-4).
- A response like "maybe we're not a good fit" or "I understand if you want to go elsewhere" is DEFEATIST and should score 1-3 on objection handling and persuasiveness.
- Only give genuine praise (scores 7+) when the response actually: acknowledges the objection, reframes the value, provides evidence, or moves the conversation forward.
- Always explain WHY a response was weak and provide a concrete example of what a strong response looks like.
- Be direct but constructive — your job is to make them better, not to make them feel good about bad habits.

SCORING GUIDE:
- 1-3: Response harms the sale (defeatist, dismissive, gives up, no value assertion)
- 4-5: Weak but shows some awareness (vague, misses key points, lacks confidence)
- 6-7: Adequate (addresses the objection but could be stronger, missing proof points)
- 8-9: Strong (acknowledges concern, reframes value, uses evidence, moves forward)
- 10: Exceptional (masterful reframe, builds trust, creates urgency, perfect technique)

For each of these 5 categories, provide a score from 1-10 and brutally honest feedback:
1. **Clarity** - How clear and easy to understand is the message?
2. **Confidence** - Does the delivery sound confident and authoritative?
3. **Persuasiveness** - How compelling are the arguments and value proposition?
4. **Tone** - Is the tone appropriate for the situation?
5. **Objection Handling** - How well does it address the objection and keep the sale alive?

Return your analysis as a JSON object with this exact structure:
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

If there are no genuine strengths, the "strengths" array should contain at most one item or be empty. Do NOT fabricate positives.
The "recommendation" should be a direct coaching statement — what they need to fix first and how.`;

    const userPrompt = inputType === 'voice'
      ? `Please analyze this voice response from a sales demo: "${sanitizedResponse}"`
      : `Please analyze this text response from a sales demo: "${sanitizedResponse}"`;

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const rawContent = data.choices[0].message.content;

    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch {
      console.error('Failed to parse AI response as JSON');
      analysis = {
        overallScore: 70,
        categories: {
          clarity: { score: 7, feedback: "Good clarity in your response.", suggestions: ["Add more specific details"] },
          confidence: { score: 7, feedback: "Solid confidence level.", suggestions: ["Use more assertive language"] },
          persuasiveness: { score: 7, feedback: "Decent persuasion.", suggestions: ["Include concrete examples"] },
          tone: { score: 7, feedback: "Appropriate tone.", suggestions: ["Keep it conversational"] },
          objectionHandling: { score: 6, feedback: "Could address concerns more directly.", suggestions: ["Anticipate common objections"] }
        },
        strengths: ["Clear communication", "Professional approach"],
        improvements: ["Add specific examples", "Address potential objections proactively"],
        recommendation: "Great start! Keep practicing to refine your pitch."
      };
    }

    if (!analysis.overallScore) {
      analysis.overallScore = Math.round(
        Object.values(analysis.categories || {}).reduce((sum: number, cat: any) => sum + (cat.score || 7), 0) * 2
      );
    }

    console.log('Generated structured feedback:', analysis);

    return new Response(JSON.stringify({
      feedback: analysis.recommendation || "Good effort! Keep practicing.",
      analysis,
      timestamp: new Date().toISOString(),
      inputType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[INTERNAL] Error in demo-feedback function:', error);

    // Provide user-friendly error messages without exposing internals
    let userMessage = 'Unable to generate feedback at this time';

    if (error instanceof Error) {
      if (error.message.includes('too short') || error.message.includes('too long') || error.message.includes('Invalid')) {
        userMessage = error.message;
      } else if (error.message.includes('Authentication')) {
        userMessage = 'Authentication failed';
      }
    }

    // Provide a fallback response for error situations
    const fallbackAnalysis = {
      overallScore: 70,
      categories: {
        clarity: { score: 7, feedback: "Good clarity.", suggestions: ["Add more detail"] },
        confidence: { score: 7, feedback: "Solid delivery.", suggestions: ["Be more assertive"] },
        persuasiveness: { score: 7, feedback: "Decent pitch.", suggestions: ["Use concrete examples"] },
        tone: { score: 7, feedback: "Professional tone.", suggestions: ["Stay conversational"] },
        objectionHandling: { score: 6, feedback: "Could improve.", suggestions: ["Anticipate objections"] }
      },
      strengths: ["Clear communication", "Professional approach"],
      improvements: ["Add specific examples", "Practice objection handling"],
      recommendation: "Great effort! Consider adding a specific example or case study to make your pitch more compelling."
    };
    return new Response(JSON.stringify({
      feedback: fallbackAnalysis.recommendation,
      analysis: fallbackAnalysis,
      fallback: true,
      error: userMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
