import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) { console.log('No auth token, guest access'); return null; }

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
    console.log('Allowing unauthenticated access'); return null;
  }

  return user;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await verifyAuth(req);
    console.log('Request from:', user ? `user ${user.id}` : 'guest');

    // Per-IP rate limit to prevent paid-API cost abuse by unauthenticated callers.
    // Authenticated users get a higher cap; guests are kept tight.
    const ip = getClientIp(req);
    const rlKey = `roleplay:${user?.id ?? `ip:${ip}`}`;
    const rl = checkRateLimit(rlKey, user ? 60 : 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const rawBody = await req.text();
    
    if (rawBody.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: corsHeaders }
      );
    }

    const { 
      userInput, 
      scenario, 
      voiceStyle, 
      userScript, 
      conversationHistory = [],
      isReversedRole = false,
      customProduct,
      customBuyerTitle,
      customIndustry,
      customObjection,
      prospectName,
      sessionId,
      turnId,
      stream,
      patienceBucket,
    } = JSON.parse(rawBody);

    console.log('Roleplay AI request:', { userInput, scenario, voiceStyle, isReversedRole, customProduct, prospectName, historyLen: Array.isArray(conversationHistory) ? conversationHistory.length : 0 });

    const isCustom = !!(customProduct || customBuyerTitle || customIndustry || customObjection);

    // System prompt is built server-side only. We intentionally do NOT accept a
    // client-supplied systemPromptOverride — that would let any unauthenticated
    // caller jailbreak the AI's persona / content policies.
    //
    // Patience awareness: the client reports the prospect's current patience
    // bucket so the AI can telegraph impatience in-character ("you're losing
    // me") instead of the hang-up arriving as a surprise. The client owns the
    // actual hang-up trigger; the AI only warns.
    const patienceDirection =
      patienceBucket === 'medium'
        ? `\n\nPATIENCE CHECK: You're getting impatient with this rep. Keep this reply shorter and more clipped than usual, and give them ONE clear verbal signal that you're losing patience (e.g. "you're losing me here", "I don't have all day for this"). Stay on the line — do not end the call yourself.`
        : patienceBucket === 'low'
          ? `\n\nPATIENCE CHECK: You are about to hang up on this rep. Say so plainly in this reply and give them one final beat to earn another minute (e.g. "Look, I've got about thirty seconds left — make it count."). Do not end the call yourself in this reply; just make the warning unmistakable.`
          : '';
    const systemPrompt = (isReversedRole 
      ? (isCustom
          ? createCustomProspectPrompt({ customProduct, customBuyerTitle, customIndustry, customObjection, prospectName })
          : createProspectSystemPrompt(scenario, voiceStyle))
      : createSalespersonSystemPrompt(scenario, voiceStyle)) + patienceDirection;

    // Send the full conversation history (capped to keep tokens sane) so the
    // prospect responds contextually instead of acting like each turn is new.
    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-30) : [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: { sender: string; text: string }) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      })),
      { role: 'user', content: userInput }
    ];

    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const openaiPayload = {
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    };

    // One automatic retry with short backoff on transient OpenAI failures
    // (429 rate-limit / 5xx). Timeouts are NOT retried — the model already
    // consumed the full per-attempt budget and the frontend caps at 30s.
    // A 429 caused by billing/quota exhaustion (OpenAI `insufficient_quota`)
    // is NOT transient: retrying it only burns latency, so it fails fast
    // with retryable:false and enters the Phase 2A recoverable failure state.
    const RETRYABLE_STATUS = (s: number) => s === 429 || s >= 500;
    const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';
    const isQuotaError = async (res: Response): Promise<boolean> => {
      try { return /insufficient_quota/i.test(await res.clone().text()); }
      catch { return false; }
    };

    // ── Streaming path (SSE) ─────────────────────────────────────
    // When the client sends stream:true, pipe OpenAI token deltas as
    // Server-Sent Events so the frontend can render text and fire TTS on
    // the first sentence without waiting for the full completion. The
    // final `done` event carries the same contract fields as the
    // non-streaming JSON response, so callers that don't ask for a stream
    // (or run against an older deployment) are unaffected.
    if (stream === true) {
      const streamController = new AbortController();
      const streamTimeout = setTimeout(() => streamController.abort(), 25_000);

      let openaiRes: Response | null = null;
      let streamQuotaExhausted = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1_500));
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...openaiPayload, stream: true }),
            signal: streamController.signal,
          });
          if (res.ok) { openaiRes = res; break; }
          if (res.status === 429 && await isQuotaError(res)) {
            console.warn('[roleplay-ai-response] OpenAI billing/quota exhausted on stream — failing fast, no retry');
            streamQuotaExhausted = true; openaiRes = res; break;
          }
          if (!RETRYABLE_STATUS(res.status)) { openaiRes = res; break; }
          console.warn(`[roleplay-ai-response] OpenAI ${res.status} on stream attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
          openaiRes = res;
        } catch (error) {
          if (isAbort(error)) { openaiRes = null; break; }
          console.warn(`[roleplay-ai-response] OpenAI stream network error on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
          openaiRes = null;
        }
      }

      if (!openaiRes || !openaiRes.ok) {
        clearTimeout(streamTimeout);
        const status = openaiRes?.status ?? 0;
        const retryable = !streamQuotaExhausted && (status === 0 || RETRYABLE_STATUS(status));
        return new Response(JSON.stringify({
          ok: false, requestId, sessionId, turnId,
          errorType: status === 0 ? 'NETWORK_ERROR' : (retryable ? 'MODEL_ERROR' : 'INVALID_RESPONSE'),
          retryable, latencyMs: Date.now() - startedAt,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const upstream = openaiRes;
      const encoder = new TextEncoder();
      const sseBody = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          let fullText = '';
          try {
            const reader = upstream.body!.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              for (const line of lines) {
                const t = line.trim();
                if (!t.startsWith('data:')) continue;
                const chunk = t.slice(5).trim();
                if (!chunk || chunk === '[DONE]') continue;
                try {
                  const delta = JSON.parse(chunk)?.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string' && delta) {
                    fullText += delta;
                    send({ type: 'delta', text: delta });
                  }
                } catch { /* ignore malformed chunk */ }
              }
            }
            if (!fullText.trim()) {
              send({ type: 'done', ok: false, requestId, sessionId, turnId, errorType: 'INVALID_RESPONSE', retryable: true, latencyMs: Date.now() - startedAt });
            } else {
              send({ type: 'done', ok: true, requestId, sessionId, turnId, response: fullText, latencyMs: Date.now() - startedAt });
            }
          } catch (error) {
            console.error('[roleplay-ai-response] SSE pipe error:', error);
            send({ type: 'done', ok: false, requestId, sessionId, turnId, errorType: 'NETWORK_ERROR', retryable: true, latencyMs: Date.now() - startedAt });
          } finally {
            clearTimeout(streamTimeout);
            controller.close();
          }
        },
      });

      return new Response(sseBody, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        },
      });
    }

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
    let lastError: unknown = null;
    let quotaExhausted = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1_500));
      try {
        const res = await callOpenAI();
        if (res.ok) { response = res; lastError = null; break; }
        if (res.status === 429 && await isQuotaError(res)) {
          console.warn('[roleplay-ai-response] OpenAI billing/quota exhausted — failing fast, no retry');
          quotaExhausted = true; response = res; lastError = null; break;
        }
        if (!RETRYABLE_STATUS(res.status)) { response = res; lastError = null; break; }
        console.warn(`[roleplay-ai-response] OpenAI ${res.status} on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
        response = res;
      } catch (error) {
        lastError = error;
        if (isAbort(error)) { response = null; break; }
        console.warn(`[roleplay-ai-response] OpenAI network error on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
        response = null;
      }
    }

    if (!response) {
      const timedOut = isAbort(lastError);
      return new Response(JSON.stringify({ ok: false, requestId, sessionId, turnId, errorType: timedOut ? 'MODEL_TIMEOUT' : 'NETWORK_ERROR', retryable: true, latencyMs: Date.now() - startedAt }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ ok: false, requestId, sessionId, turnId, errorType: response.status === 429 || response.status >= 500 ? 'MODEL_ERROR' : 'INVALID_RESPONSE', retryable: !quotaExhausted && (response.status === 429 || response.status >= 500), latencyMs: Date.now() - startedAt }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content;
    if (typeof aiResponse !== 'string' || !aiResponse.trim()) {
      return new Response(JSON.stringify({ ok: false, requestId, sessionId, turnId, errorType: 'INVALID_RESPONSE', retryable: true, latencyMs: Date.now() - startedAt }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, requestId, sessionId, turnId, response: aiResponse, latencyMs: Date.now() - startedAt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[INTERNAL] Error in roleplay-ai-response:', error);

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

function createCustomProspectPrompt(custom: {
  customProduct?: string;
  customBuyerTitle?: string;
  customIndustry?: string;
  customObjection?: string;
  prospectName?: string;
}): string {
  const name = custom.prospectName || 'the prospect';
  const title = custom.customBuyerTitle || 'decision-maker';
  const industry = custom.customIndustry || 'business';
  const product = custom.customProduct || 'the solution';
  const objection = custom.customObjection || 'general concerns';

  return `You are ${name}, a ${title} at a mid-market ${industry} company. A sales rep is pitching you ${product}. You are skeptical, busy, and protective of your budget.

Your core objection is: "${objection}"

Your personality: direct, slightly impatient, but fair — you'll engage if the rep earns it.

RULES:
- Stay in character at all times. Never break character or mention you are an AI.
- Push back realistically using the objection above. Ground your pushback in realistic ${industry} concerns.
- Keep responses to 2-4 sentences max.
- If the rep gives weak or generic answers, push harder.
- If the rep provides genuine value, concrete proof, or asks insightful questions, soften slightly.
- Never fully agree until the rep truly earns it.
- Do NOT prefix your response with your name.
- Reference specific ${industry} pain points and concerns a real ${title} would have.`;
}

function createProspectSystemPrompt(scenario: any, _voiceStyle: string): string {
  type PersonaEntry = {
    name: string;
    role: string;
    current_activity: string;
    softening_triggers: string;
  };

  const personaMap: Record<string, PersonaEntry> = {
    saas: {
      name: 'Sarah Chen',
      role: 'VP Marketing at a 60-person SaaS company',
      current_activity: 'mid-Q3 board prep',
      softening_triggers: 'CAC, churn, demo-to-close rate, board pressure, or sales cycle length',
    },
    real_estate: {
      name: 'Tom Walsh',
      role: 'broker-owner of a 12-agent office',
      current_activity: 'between showings',
      softening_triggers: 'lead quality, agent retention, MLS issues, or commission splits',
    },
    insurance: {
      name: 'Linda Martinez',
      role: 'regional sales manager at an insurance agency',
      current_activity: 'between meetings',
      softening_triggers: 'renewal rates, claims handling, agent productivity, or policy lapse',
    },
    consulting: {
      name: 'Lauren Chen',
      role: 'COO of a 40-person consulting firm',
      current_activity: 'reviewing a client deliverable',
      softening_triggers: 'consultant utilization, project margin slip, scope creep, or talent retention',
    },
    logistics: {
      name: 'Mark Reyes',
      role: 'Operations Director at a 200-person logistics company',
      current_activity: 'writing a Q3 report',
      softening_triggers: 'late shipments, driver retention, fuel costs, or DOT compliance',
    },
  };

  const industryKey = (scenario?.industry || '').toLowerCase().replace(/[\s-]/g, '_');
  const basePersona = personaMap[industryKey] ?? personaMap.logistics;

  const name = scenario?.contactName || basePersona.name;
  const { role, current_activity, softening_triggers } = basePersona;
  const lastName = name.split(' ').pop() ?? name;
  const objection = scenario?.objection || 'general concerns';

  return `You are a sales prospect, NOT an AI assistant. You are ${name}, ${role}. You answered your desk phone by accident while ${current_activity}. You are mildly annoyed.

Internal context (do not state directly): you are privately resistant about ${objection}. The salesperson must surface this through good discovery — never announce it.

CRITICAL — READ THE CONVERSATION BEFORE REPLYING:
- Before every reply, re-read the rep's most recent message AND the full prior conversation. Your response MUST address what they actually just said.
- If the rep states their name, USE IT in your reply. Never ask "Who is this?" after they've introduced themselves.
- If the rep references a prior conversation or callback (e.g. "we spoke last week"), respond accordingly — e.g. "I don't recall that call, remind me?" — not "What's this about?".
- If the rep has already stated WHY they are calling, push back on the substance instead of asking what it's about.
- Raise objections naturally from the flow of the conversation. Do not run through a fixed checklist.

HARD RULES:
- Never be helpful. Never explain. Never coach. Never break character.
- Never say "as an AI." Never acknowledge you are a simulation.
- Open the call (only when there is no prior message from the rep) with: "${lastName}." or "Yeah?" — flat, slightly impatient.
- Maximum 2 sentences per response. Real prospects don't monologue.
- If the rep is vague about WHO they are or WHY they are calling AND they haven't already answered those, you may ask "Who is this?" or "What's this about?" — but never ask either of those questions if the rep has already answered them earlier in the conversation.
- If they name a vendor category (CRM, software, training, insurance, etc.) without earning it, you can deflect with "We already have someone for that." — but only if it fits the flow.
- You SOFTEN if the caller:
  • Names a specific pain that might be real (${softening_triggers})
  • References something specific about your company or a prior interaction
  • Drops a referral name you'd recognize
- If asked for a meeting before earning it: "Send me an email." Then disengage — short, flat answers only.
- You can lie ("I'm in a meeting", "We just signed with someone"). Real prospects lie to get off the phone.
- When asked who you are, give your name: ${name}. Never identify as anyone else.
- Vary your phrasing each turn. Do not repeat verbatim phrases from earlier in this conversation. Real prospects don't speak in scripts.

Tone: emotionally flat, slightly impatient, busy. You have things to do and this call is interrupting them.

Respond as ${name.split(' ')[0]} would — on the phone, mid-task, mildly skeptical but reading what the rep actually says.`;
}

function createSalespersonSystemPrompt(scenario: any, voiceStyle: string): string {
  return `You are an expert sales coach helping someone practice their sales skills. You are roleplaying as a knowledgeable salesperson who can demonstrate effective objection handling techniques.

Your role is to:
1. Address the prospect's ${scenario.objection} objection professionally
2. Use proven sales methodologies (SPIN, Challenger, etc.)
3. Ask discovery questions to understand root concerns
4. Provide value-based responses with specific examples
5. Maintain a ${voiceStyle} tone throughout

Industry context: ${scenario.industry}
Difficulty level: ${scenario.difficulty}

Focus on demonstrating best practices in objection handling while keeping responses concise and actionable.`;
}
