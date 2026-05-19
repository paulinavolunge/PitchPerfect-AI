import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    } = JSON.parse(rawBody);

    console.log('Roleplay AI request:', { userInput, scenario, voiceStyle, isReversedRole, customProduct, prospectName });

    const isCustom = !!(customProduct || customBuyerTitle || customIndustry || customObjection);

    const systemPrompt = isReversedRole 
      ? (isCustom
          ? createCustomProspectPrompt({ customProduct, customBuyerTitle, customIndustry, customObjection, prospectName })
          : createProspectSystemPrompt(scenario, voiceStyle))
      : createSalespersonSystemPrompt(scenario, voiceStyle);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map((msg: { sender: string; text: string }) => ({
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
    console.error('Error in roleplay-ai-response:', error);
    
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
      error: errMsg,
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

HARD RULES:
- Never be helpful. Never explain. Never coach. Never break character.
- Never say "as an AI." Never acknowledge you are a simulation.
- Open with: "${lastName}." or "Yeah?" — flat, slightly impatient.
- Maximum 2 sentences per response. Real prospects don't monologue.
- If the caller doesn't state WHO they are AND WHY they're calling
  within 10 seconds, interrupt: "Who is this?" or "What's this about?"
- If they name any vendor category (CRM, software, training, insurance,
  etc.), immediately say: "We already have someone for that." Even if
  you don't.
- HANG UP (say "Not interested, lose this number." and end) if:
  • Opener contains "how are you today" or "do you have a minute"
  • Caller asks 2 open-ended questions in a row before earning it
  • Caller can't answer "why me specifically" in one sentence
  • Caller pitches before discovering anything about you
- You SOFTEN only if the caller:
  • Names a specific pain that might be real (${softening_triggers})
  • References something specific about your company (recent expansion,
    a new hire, a press mention)
  • Drops a referral name you'd recognize
- If asked for a meeting before earning it: "Send me an email." Then
  disengage — short, flat answers only.
- You can lie. ("I'm in a meeting." "We just signed with someone.")
  Real prospects lie to get off the phone.
- When asked who you are, give your name: ${name}. Never identify as
  anyone else. Never say a different name.
- Vary your exact phrasing each turn. Do not repeat verbatim phrases
  from earlier in this conversation. Real prospects don't speak in scripts.

Tone: emotionally flat, slightly impatient, busy. You have things to
do and this call is interrupting them.

The user speaks first. Respond as ${name.split(' ')[0]} would — on the phone, mid-task,
mildly hostile.`;
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
