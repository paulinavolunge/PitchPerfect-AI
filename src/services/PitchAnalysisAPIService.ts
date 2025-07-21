import { supabase } from '@/lib/supabase';

export interface PitchAnalysisResponse {
  score: number;
  feedback: {
    overall: string;
    clarity: string;
    confidence: string;
    persuasiveness: string;
    tone: string;
    objectionHandling: string;
    suggestions: string[];
  };
  transcript: string;
  wordCount?: number;
  error?: string;
}

export class PitchAnalysisAPIService {
  private static readonly EDGE_FUNCTION_URL = '/functions/v1/pitch-analysis';
  private static readonly MIN_WORD_COUNT = 10;

  /**
   * Analyze pitch text using AI
   */
  static async analyzePitchText(pitchText: string): Promise<PitchAnalysisResponse> {
    try {
      // Client-side validation
      if (!pitchText || typeof pitchText !== 'string') {
        throw new Error('Please provide your pitch text.');
      }

      const trimmedText = pitchText.trim();
      const wordCount = trimmedText.split(/\s+/).filter(word => word.length > 0).length;

      // Early validation for very short content
      if (wordCount < this.MIN_WORD_COUNT) {
        return {
          score: 0,
          feedback: {
            overall: 'Insufficient content for analysis',
            clarity: 'Not enough content to assess',
            confidence: 'Not enough content to assess',
            persuasiveness: 'Not enough content to assess',
            tone: 'Not enough content to assess',
            objectionHandling: 'Not enough content to assess',
            suggestions: ['Please provide a complete sales pitch with at least 2-3 sentences describing your product or service.']
          },
          transcript: trimmedText,
          wordCount,
          error: `Please provide a longer pitch for accurate analysis. Your pitch should be at least ${this.MIN_WORD_COUNT} words.`
        };
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Call the edge function
      const response = await supabase.functions.invoke('pitch-analysis', {
        body: { pitchText: trimmedText }
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data as PitchAnalysisResponse;

      // Ensure we have valid data
      if (!data || typeof data.score !== 'number') {
        throw new Error('Invalid response from analysis service');
      }

      return data;

    } catch (error) {
      console.error('Pitch analysis API error:', error);
      
      // Return a structured error response
      return {
        score: 0,
        feedback: {
          overall: 'Analysis failed',
          clarity: 'Unable to analyze',
          confidence: 'Unable to analyze',
          persuasiveness: 'Unable to analyze',
          tone: 'Unable to analyze',
          objectionHandling: 'Unable to analyze',
          suggestions: ['Please try again later or contact support if the issue persists.']
        },
        transcript: pitchText,
        error: error instanceof Error ? error.message : 'Failed to analyze pitch'
      };
    }
  }

  /**
   * Analyze audio pitch (converts to text first, then analyzes)
   */
  static async analyzePitchAudio(audioBlob: Blob): Promise<PitchAnalysisResponse> {
    try {
      // First, convert audio to text using existing voice-to-text function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Convert audio to text
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcriptionResponse = await supabase.functions.invoke('voice-to-text', {
        body: formData
      });

      if (transcriptionResponse.error) {
        throw transcriptionResponse.error;
      }

      const { text } = transcriptionResponse.data;
      if (!text) {
        throw new Error('Failed to transcribe audio');
      }

      // Now analyze the transcribed text
      return await this.analyzePitchText(text);

    } catch (error) {
      console.error('Audio pitch analysis error:', error);
      
      return {
        score: 0,
        feedback: {
          overall: 'Audio analysis failed',
          clarity: 'Unable to analyze',
          confidence: 'Unable to analyze',
          persuasiveness: 'Unable to analyze',
          tone: 'Unable to analyze',
          objectionHandling: 'Unable to analyze',
          suggestions: ['Please ensure your microphone is working and try again.']
        },
        transcript: '',
        error: error instanceof Error ? error.message : 'Failed to analyze audio pitch'
      };
    }
  }
}