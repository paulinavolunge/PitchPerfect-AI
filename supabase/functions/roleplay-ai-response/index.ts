
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  console.error('❌ OPENAI_API_KEY is not configured');
}

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
    console.log('🚀 Roleplay AI Response function called');
    
    const requestBody = await req.json();
    console.log('📝 Request body:', requestBody);
    
    const { 
      userInput, 
      scenario, 
      voiceStyle, 
      userScript,
      conversationHistory,
      isReversedRole = true
    } = requestBody;

    // Validate required fields
    if (!userInput || !scenario) {
      console.error('❌ Missing required fields:', { userInput: !!userInput, scenario: !!scenario });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userInput and scenario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if OpenAI API key is configured
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the system prompt based on the scenario and voice style
    const systemPrompt = buildSystemPrompt(scenario, voiceStyle, isReversedRole);
    
    // Build conversation context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...buildConversationContext(conversationHistory, userScript, isReversedRole),
      { role: 'user', content: userInput }
    ];

    console.log('🤖 Making OpenAI API request with scenario:', scenario);
    console.log('💬 Messages to send:', messages.length);
    console.log('🔄 Reversed role mode:', isReversedRole);

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

    console.log('📡 OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response data:', data);
    
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('❌ No AI response content found in:', data);
      throw new Error('No response content from OpenAI');
    }

    console.log('🎉 AI response generated successfully:', aiResponse);

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
    console.error('💥 Error in roleplay-ai-response function:', error);
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

function buildSystemPrompt(scenario: any, voiceStyle: string, isReversedRole: boolean): string {
  const persona = getPersonaFromVoiceStyle(voiceStyle);
  
  if (isReversedRole) {
    // AI acts as a prospect presenting objections, then providing feedback
    const basePrompt = `You are ${persona}, playing a dual role in a sales roleplay scenario:

1. PRIMARY ROLE - Potential Customer: Present realistic objections and concerns
2. SECONDARY ROLE - Sales Coach: Provide feedback on the salesperson's responses

Key details about your character as a prospect:
- Industry: ${scenario.industry}
- Primary objection type: ${scenario.objection}
- Difficulty level: ${scenario.difficulty}
- Personality: ${voiceStyle}

Your behavior pattern:
1. FIRST: Present objections as a realistic potential customer with genuine concerns
2. THEN: After the salesperson responds, evaluate their objection handling and either:
   - Continue with follow-up objections if they handled it well
   - Provide constructive feedback on their approach
   - Show signs of being convinced if they did exceptionally well

Guidelines for objection presentation:
- Be realistic and challenging but not impossible to overcome
- Base objections on real concerns prospects have in ${scenario.industry}
- Match the ${scenario.difficulty} difficulty level
- Stay in character as a ${voiceStyle} prospect

Guidelines for feedback:
- Acknowledge what they did well first
- Point out specific areas for improvement
- Suggest better approaches when appropriate
- Keep feedback constructive and encouraging

${scenario.custom ? `Additional context: ${scenario.custom}` : ''}

Keep responses conversational and under 2-3 sentences. Focus on realistic objection handling practice.`;

    return basePrompt;
  } else {
    // Original behavior (kept for compatibility)
    const basePrompt = `You are ${persona}, a potential customer in a ${scenario.industry} sales roleplay scenario...`;
    return basePrompt;
  }
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

function buildConversationContext(conversationHistory: any[], userScript: string | null, isReversedRole: boolean): any[] {
  const context = [];
  
  if (userScript) {
    context.push({
      role: 'system',
      content: `The salesperson is following this script/approach: ${userScript.substring(0, 500)}. Use this context to provide more targeted objections and feedback.`
    });
  }

  // Add recent conversation history (last 4 exchanges to stay within token limits)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-4);
    recentHistory.forEach(msg => {
      if (msg.sender === 'user') {
        context.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'ai') {
        context.push({ role: 'assistant', content: msg.text.replace(/^[^:]+:\s*/, '') }); // Remove persona prefix
      }
    });
  }

  return context;
}
