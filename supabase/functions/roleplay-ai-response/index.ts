
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userInput, 
      scenario, 
      voiceStyle, 
      userScript,
      conversationHistory 
    } = await req.json();

    // Validate required fields
    if (!userInput || !scenario) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userInput and scenario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the system prompt based on the scenario and voice style
    const systemPrompt = buildSystemPrompt(scenario, voiceStyle);
    
    // Build conversation context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...buildConversationContext(conversationHistory, userScript),
      { role: 'user', content: userInput }
    ];

    console.log('Making OpenAI API request with scenario:', scenario);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('OpenAI response generated successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        scenario: scenario,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in roleplay-ai-response function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI response',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemPrompt(scenario: any, voiceStyle: string): string {
  const persona = getPersonaFromVoiceStyle(voiceStyle);
  
  const basePrompt = `You are ${persona}, a potential customer in a ${scenario.industry} sales roleplay scenario. You will be practicing objection handling with a salesperson.

Key details about your character:
- Industry: ${scenario.industry}
- Primary objection type: ${scenario.objection}
- Difficulty level: ${scenario.difficulty}
- Personality: ${voiceStyle}

Your role:
1. Act as a realistic potential customer with genuine concerns
2. Present objections naturally based on the scenario type (${scenario.objection})
3. Be ${voiceStyle} in your responses
4. Challenge the salesperson appropriately for ${scenario.difficulty} difficulty level
5. Stay in character throughout the conversation
6. Give thoughtful responses that help the salesperson practice

${scenario.custom ? `Additional context: ${scenario.custom}` : ''}

Keep responses conversational, realistic, and focused on the ${scenario.objection} objection type. Respond as if you're a real customer in this situation.`;

  return basePrompt;
}

function getPersonaFromVoiceStyle(voiceStyle: string): string {
  const personas = {
    friendly: 'Alex, a friendly and approachable customer',
    assertive: 'Jordan, a confident and direct decision-maker',
    skeptical: 'Morgan, a cautious and questioning prospect',
    rushed: 'Taylor, a busy executive with limited time',
  };
  return personas[voiceStyle as keyof typeof personas] || 'a potential customer';
}

function buildConversationContext(conversationHistory: any[], userScript: string | null): any[] {
  const context = [];
  
  if (userScript) {
    context.push({
      role: 'system',
      content: `The salesperson is following this script/approach: ${userScript.substring(0, 500)}. Use this context to provide more targeted responses and objections.`
    });
  }

  // Add recent conversation history (last 4 exchanges to stay within token limits)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4);
    recentHistory.forEach(msg => {
      if (msg.sender === 'user') {
        context.push({ role: 'assistant', content: msg.text });
      } else if (msg.sender === 'ai') {
        context.push({ role: 'user', content: msg.text });
      }
    });
  }

  return context;
}
