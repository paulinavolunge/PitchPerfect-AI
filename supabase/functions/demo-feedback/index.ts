import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null; // Allow guest users

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null; // Return null instead of throwing

  return user;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication (optional for demo)
    const user = await verifyAuth(req);
    if (user) {
      console.log('Authenticated user:', user.id);
    } else {
      console.log('Guest user accessing demo');
    }
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { response, inputType } = await req.json();

    console.log('Demo feedback request:', { response, inputType, isGuest: !user });

    const systemPrompt = `You are an expert sales coach providing feedback on demo responses. 

Analyze the user's response and provide constructive, encouraging feedback that:
1. Highlights what they did well
2. Suggests specific improvements
3. Offers actionable advice for sales situations
4. Maintains a positive, coaching tone

Keep feedback concise but specific - aim for 2-3 sentences that are immediately actionable.

Focus on sales communication best practices:
- Value proposition clarity
- Customer focus
- Confidence and professionalism
- Addressing potential concerns
- Use of examples and proof points`;

    const userPrompt = inputType === 'voice' 
      ? `Please provide coaching feedback on this voice response from a sales demo: "${response}"`
      : `Please provide coaching feedback on this text response from a sales demo: "${response}"`;

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
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const feedback = data.choices[0].message.content;

    console.log('Generated feedback:', feedback);

    return new Response(JSON.stringify({ 
      feedback,
      timestamp: new Date().toISOString(),
      inputType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in demo-feedback function:', error);
    
    // Provide a fallback response
    const fallbackFeedback = "Great effort! Your response shows good understanding of the value proposition. Consider adding a specific example or case study to make your pitch even more compelling.";
    
    return new Response(JSON.stringify({ 
      feedback: fallbackFeedback,
      fallback: true,
      error: error.message 
    }), {
      status: 200, // Still return 200 for fallback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});