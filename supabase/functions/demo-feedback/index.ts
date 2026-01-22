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
      ? `Please provide coaching feedback on this voice response from a sales demo: "${sanitizedResponse}"`
      : `Please provide coaching feedback on this text response from a sales demo: "${sanitizedResponse}"`;

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
    const fallbackFeedback = "Great effort! Your response shows good understanding of the value proposition. Consider adding a specific example or case study to make your pitch even more compelling.";
    return new Response(JSON.stringify({
      feedback: fallbackFeedback,
      fallback: true,
      error: userMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
