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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (token === anonKey) {
      console.log('Guest user access via anon key');
      return null;
    }
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
      systemPromptOverride,
    } = JSON.parse(rawBody);

    console.log('Roleplay AI request:', { userInput, scenario, voiceStyle, isReversedRole, customProduct, prospectName, hasOverride: !!systemPromptOverride, historyLen: Array.isArray(conversationHistory) ? conversationHistory.length : 0 });

    const isCustom = !!(customProduct || customBuyerTitle || customIndustry || customObjection);

    // If the client supplies a fully-formed persona prompt (e.g. the cold-call
    // hook), use it verbatim — it has context the generic builders don't.
    const baseSystemPrompt = isReversedRole 
      ? (isCustom
          ? createCustomProspectPrompt({ customProduct, customBuyerTitle, customIndustry, customObjection, prospectName })
          : createProspectSystemPrompt(scenario, voiceStyle))
      : createSalespersonSystemPrompt(scenario, voiceStyle);

    const systemPrompt = (typeof systemPromptOverride === 'string' && systemPromptOverride.trim().length > 50)
      ? `${systemPromptOverride.trim()}\n\nCRITICAL: Read the entire conversation above carefully before replying. Always acknowledge information the rep has already given you (name, company, callback reference, prior pitch). Never ask "Who is this?" if they have introduced themselves. Never ask "What's this about?" if they have already told you why they are calling. Respond to what was actually said.`
      : baseSystemPrompt;

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
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
