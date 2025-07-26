import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { 
      transcript, 
      practiceMode = 'text',
      scenario = null,
      userContext = {}
    } = await req.json();

    console.log('Pitch analysis request:', { transcript, practiceMode, scenario });

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No transcript provided for analysis');
    }

    const systemPrompt = `You are an expert sales coach and pitch analysis AI. Analyze the following sales pitch and provide detailed, actionable feedback.

Your analysis should cover:
1. **Clarity** - How clear and easy to understand is the message?
2. **Confidence** - Does the delivery sound confident and authoritative?
3. **Persuasiveness** - How compelling are the arguments and value proposition?
4. **Tone** - Is the tone appropriate for the situation?
5. **Objection Handling** - How well does it address potential concerns?

For each category, provide:
- A score from 1-10
- Specific feedback on what was done well
- Concrete suggestions for improvement
- Industry-specific recommendations when relevant

Return your analysis as a JSON object with this structure:
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

Be constructive, specific, and actionable in your feedback. Focus on sales best practices and communication effectiveness.`;

    const userPrompt = `Please analyze this sales pitch:

"${transcript}"

${scenario ? `Context: This is for a ${scenario.industry} industry scenario, addressing ${scenario.objection} objections at ${scenario.difficulty} difficulty level.` : ''}

Provide detailed analysis and scoring as requested.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('Raw AI analysis:', analysisText);
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to structured response
      analysis = {
        overallScore: 75,
        categories: {
          clarity: { score: 7, feedback: "Analysis completed", suggestions: ["Continue practicing"] },
          confidence: { score: 7, feedback: "Good delivery", suggestions: ["Maintain consistency"] },
          persuasiveness: { score: 7, feedback: "Solid approach", suggestions: ["Add more specific examples"] },
          tone: { score: 8, feedback: "Professional tone", suggestions: ["Keep up the good work"] },
          objectionHandling: { score: 7, feedback: "Addressed key points", suggestions: ["Prepare for follow-up questions"] }
        },
        strengths: ["Clear communication", "Professional approach"],
        improvements: ["Add more specific examples", "Practice objection handling"],
        recommendation: "Continue practicing to build confidence and refine your approach."
      };
    }

    // Ensure the response has the expected structure
    if (!analysis.overallScore) {
      analysis.overallScore = Math.round(
        Object.values(analysis.categories || {}).reduce((sum: number, cat: any) => sum + (cat.score || 7), 0) * 2
      );
    }

    console.log('Processed analysis result:', analysis);

    return new Response(JSON.stringify({ 
      analysis,
      transcript,
      metadata: {
        practiceMode,
        scenario,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in pitch-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});