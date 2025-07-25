import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { 
      userInput, 
      scenario, 
      voiceStyle, 
      userScript, 
      conversationHistory = [],
      isReversedRole = false 
    } = await req.json();

    console.log('Roleplay AI request:', { userInput, scenario, voiceStyle, isReversedRole });

    const systemPrompt = isReversedRole 
      ? createProspectSystemPrompt(scenario, voiceStyle)
      : createSalespersonSystemPrompt(scenario, voiceStyle);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
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
        model: 'gpt-4.1-2025-04-14',
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
    return new Response(JSON.stringify({
      error: error.message,
      fallback: true,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function createProspectSystemPrompt(scenario: any, voiceStyle: string): string {
  const objectionTypes = {
    Price: 'price and cost concerns',
    Timing: 'timing and urgency issues',
    Trust: 'trust and credibility concerns',
    Authority: 'decision-making authority limitations',
    Competition: 'competitive alternatives',
    Need: 'necessity and requirement questions'
  };

  const voiceStyles = {
    friendly: 'Be conversational and warm, but maintain your objections',
    assertive: 'Be direct and businesslike in your responses',
    skeptical: 'Be questioning and require strong proof',
    rushed: 'Be brief and impatient, focusing on quick decisions'
  };

  const objectionFocus = objectionTypes[scenario.objection] || 'general concerns';
  const styleGuidance = voiceStyles[voiceStyle] || voiceStyles.friendly;

  return `You are a realistic sales prospect for a ${scenario.industry} company. You have genuine ${objectionFocus} about the solution being pitched to you.

Your role is to:
1. Act as a challenging but realistic prospect
2. Present objections that are common in ${scenario.industry}
3. ${styleGuidance}
4. Gradually soften your position if the salesperson handles objections well
5. Ask probing questions to test their knowledge
6. Respond naturally to their rebuttals

Key behavioral traits:
- Start with the main objection: ${scenario.objection}
- Be willing to engage but maintain realistic skepticism
- Reward good objection handling with positive responses
- Introduce follow-up concerns if they handle the initial objection well
- Keep responses concise (1-3 sentences typically)
- Sound like a real business decision-maker

Industry context: ${scenario.industry}
Difficulty level: ${scenario.difficulty}

Do not be overly difficult or unreasonable. Your goal is to help the salesperson practice realistic objection handling.`;
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
