import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pitchText } = await req.json();
    
    // Input validation
    if (!pitchText || typeof pitchText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Please provide your pitch text.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedText = pitchText.trim();
    const wordCount = trimmedText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Check for minimum content
    if (wordCount < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Please provide a longer pitch for accurate analysis. Your pitch should be at least 10 words.',
          score: 0,
          feedback: {
            overall: 'Insufficient content for analysis',
            clarity: 'Not enough content to assess',
            confidence: 'Not enough content to assess',
            persuasiveness: 'Not enough content to assess',
            tone: 'Not enough content to assess',
            objectionHandling: 'Not enough content to assess',
            suggestions: ['Please provide a complete sales pitch with at least 2-3 sentences describing your product or service.']
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for very short or low-quality content
    if (wordCount < 30 || trimmedText.length < 100) {
      // For short content, provide low scores with constructive feedback
      return new Response(
        JSON.stringify({
          score: Math.min(15, Math.floor(wordCount / 2)),
          feedback: {
            overall: 'Your pitch needs significant development',
            clarity: 'Too brief to communicate value effectively',
            confidence: 'Lacks substance and detail',
            persuasiveness: 'Missing key value propositions',
            tone: 'Too short to establish professional tone',
            objectionHandling: 'No anticipation of customer concerns',
            suggestions: [
              'Expand your pitch to include specific benefits',
              'Add concrete examples or case studies',
              'Include a clear call-to-action',
              'Address potential customer objections'
            ]
          },
          transcript: trimmedText
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🤖 Analyzing pitch with OpenAI...');
    
    const systemPrompt = `You are an expert sales coach analyzing sales pitches. Evaluate the pitch and provide:
    1. A score from 0-100
    2. Specific feedback on: clarity, confidence, persuasiveness, tone, and objection handling
    3. Actionable suggestions for improvement
    
    Be strict but constructive. Reserve high scores (80+) for truly excellent pitches.
    For generic or low-effort content, give appropriately low scores.
    
    Return your response in this JSON format:
    {
      "score": <number>,
      "feedback": {
        "overall": "<overall assessment>",
        "clarity": "<clarity feedback>",
        "confidence": "<confidence feedback>",
        "persuasiveness": "<persuasiveness feedback>",
        "tone": "<tone feedback>",
        "objectionHandling": "<objection handling feedback>",
        "suggestions": ["<suggestion 1>", "<suggestion 2>", ...]
      }
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this sales pitch:\n\n"${trimmedText}"` }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    // Ensure score is within bounds
    analysis.score = Math.max(0, Math.min(100, analysis.score));
    
    console.log('✅ Pitch analysis complete:', { score: analysis.score, wordCount });

    return new Response(
      JSON.stringify({
        ...analysis,
        transcript: trimmedText,
        wordCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Pitch analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze pitch. Please try again.',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});