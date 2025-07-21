import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { transcript, mode, userId } = await req.json()

    if (!transcript || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Analyze the transcript for key elements
    const analysis = analyzePitch(transcript)
    
    // Generate a score based on the analysis
    const score = calculateScore(analysis)
    
    // Generate structured feedback
    const feedback = {
      clarity: analysis.clarity,
      confidence: analysis.confidence,
      persuasiveness: analysis.persuasiveness,
      tone: analysis.tone,
      objectionHandling: analysis.objectionHandling,
      fillerWords: analysis.fillerWords,
      suggestions: generateSuggestions(analysis)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        score,
        feedback,
        analysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in analyze-pitch function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function analyzePitch(transcript: string) {
  const lowerTranscript = transcript.toLowerCase()
  const wordCount = transcript.split(/\s+/).length
  
  // Analyze various aspects
  const hasValue = /\b(value|benefit|roi|save|increase|improve|reduce)\b/i.test(transcript)
  const hasEmpathy = /\b(understand|appreciate|hear|feel|recognize)\b/i.test(transcript)
  const hasSpecifics = /\b(example|specifically|case study|data|research)\b/i.test(transcript)
  const hasQuestions = transcript.includes('?')
  const hasNumbers = /\d+/.test(transcript)
  
  // Count filler words
  const fillerWords = (transcript.match(/\b(um|uh|like|you know|basically|actually|literally)\b/gi) || []).length
  
  // Clarity analysis
  const avgSentenceLength = transcript.split(/[.!?]+/).filter(s => s.trim()).length > 0 
    ? wordCount / transcript.split(/[.!?]+/).filter(s => s.trim()).length 
    : wordCount
  
  const clarity = avgSentenceLength < 15 && wordCount > 30
    ? 'Clear and concise communication'
    : avgSentenceLength < 25
    ? 'Mostly clear with some complex sentences'
    : 'Consider breaking down complex ideas into simpler sentences'
  
  // Confidence analysis
  const confidence = fillerWords < 2 && wordCount > 50
    ? 'Strong and confident delivery'
    : fillerWords < 5
    ? 'Good confidence with minor hesitations'
    : 'Work on reducing filler words for more confident delivery'
  
  // Persuasiveness analysis
  const persuasiveness = hasValue && hasNumbers
    ? 'Excellent use of value propositions and data'
    : hasValue
    ? 'Good focus on value, consider adding specific metrics'
    : 'Focus more on specific benefits and outcomes'
  
  // Tone analysis
  const tone = hasEmpathy && hasQuestions
    ? 'Engaging and empathetic approach'
    : hasEmpathy
    ? 'Good empathy, consider asking discovery questions'
    : 'Add more warmth and understanding to build rapport'
  
  // Objection handling
  const objectionHandling = hasEmpathy && hasSpecifics && hasValue
    ? 'Excellent objection handling technique'
    : hasSpecifics
    ? 'Good use of examples, add more empathy'
    : 'Use specific examples and acknowledge concerns'
  
  return {
    clarity,
    confidence,
    persuasiveness,
    tone,
    objectionHandling,
    fillerWords,
    hasValue,
    hasEmpathy,
    hasSpecifics,
    hasQuestions,
    hasNumbers,
    wordCount
  }
}

function calculateScore(analysis: any): number {
  let score = 70 // Base score
  
  // Add points for positive elements
  if (analysis.hasValue) score += 5
  if (analysis.hasEmpathy) score += 5
  if (analysis.hasSpecifics) score += 5
  if (analysis.hasQuestions) score += 3
  if (analysis.hasNumbers) score += 4
  
  // Deduct for filler words
  score -= Math.min(analysis.fillerWords * 2, 10)
  
  // Adjust based on word count
  if (analysis.wordCount > 50 && analysis.wordCount < 200) score += 3
  else if (analysis.wordCount < 30) score -= 5
  
  return Math.max(60, Math.min(100, score))
}

function generateSuggestions(analysis: any): string[] {
  const suggestions = []
  
  if (!analysis.hasValue) {
    suggestions.push('Focus on specific value propositions and benefits')
  }
  
  if (!analysis.hasEmpathy) {
    suggestions.push('Start with empathy - acknowledge their concerns first')
  }
  
  if (!analysis.hasSpecifics) {
    suggestions.push('Include concrete examples or case studies')
  }
  
  if (!analysis.hasQuestions) {
    suggestions.push('Ask discovery questions to understand their needs better')
  }
  
  if (analysis.fillerWords > 3) {
    suggestions.push('Practice reducing filler words for clearer communication')
  }
  
  if (!analysis.hasNumbers) {
    suggestions.push('Add specific metrics or data points to strengthen your argument')
  }
  
  // Always provide at least one positive suggestion
  if (suggestions.length === 0) {
    suggestions.push('Great job! Continue refining your pitch with more practice')
  }
  
  return suggestions.slice(0, 3) // Return top 3 suggestions
}