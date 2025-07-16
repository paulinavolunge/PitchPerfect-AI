
import { whisperTranscribe } from '../lib/whisper-api';
import { VoiceInputSecurity } from './voiceInputSecurity';
import { supabase } from '@/integrations/supabase/client';

// Native speech recognition for browsers that support it
const nativeSpeechRecognition = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let hasResult = false;
      let timeoutId: NodeJS.Timeout;

      // Set a timeout to prevent hanging
      timeoutId = setTimeout(() => {
        if (!hasResult) {
          recognition.stop();
          reject(new Error('Speech recognition timeout'));
        }
      }, 10000);

      recognition.onresult = (event: any) => {
        hasResult = true;
        clearTimeout(timeoutId);
        
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          const sanitizedTranscript = VoiceInputSecurity.sanitizeTranscription(transcript);
          console.log('Native speech recognition result:', sanitizedTranscript);
          resolve(sanitizedTranscript);
        } else {
          reject(new Error('No speech detected'));
        }
      };

      recognition.onerror = (event: any) => {
        hasResult = true;
        clearTimeout(timeoutId);
        console.error('Speech recognition error:', event.error);
        reject(new Error('Speech recognition failed: ' + event.error));
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        if (!hasResult) {
          reject(new Error('Speech recognition ended without result'));
        }
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

export const processVoiceInput = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('Processing voice input, blob size:', audioBlob.size);
    
    // Get current user for rate limiting
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required for voice processing');
    }

    // Check rate limiting
    if (VoiceInputSecurity.isRateLimited(user.id)) {
      throw new Error('Voice processing rate limit exceeded. Please try again later.');
    }

    // Validate audio blob
    if (!VoiceInputSecurity.validateAudioBlob(audioBlob)) {
      throw new Error('Invalid audio format or size');
    }

    let transcript: string;

    // Check if we have native speech recognition support
    const hasNativeSpeech = typeof (window as any).SpeechRecognition !== 'undefined' || 
                           typeof (window as any).webkitSpeechRecognition !== 'undefined';

    if (hasNativeSpeech && audioBlob.size < 1024 * 1024) { // Use native for smaller files
      console.log('Attempting native speech recognition');
      try {
        transcript = await nativeSpeechRecognition();
      } catch (error) {
        console.warn('Native speech recognition failed, falling back to Whisper:', error);
        const rawTranscript = await whisperTranscribe(audioBlob);
        transcript = VoiceInputSecurity.sanitizeTranscription(rawTranscript);
      }
    } else {
      console.log('Using Whisper API for transcription');
      const rawTranscript = await whisperTranscribe(audioBlob);
      transcript = VoiceInputSecurity.sanitizeTranscription(rawTranscript);
    }

    console.log('Voice processing complete, transcript:', transcript);

    // Secure cleanup
    VoiceInputSecurity.secureCleanup(audioBlob);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No speech detected in audio');
    }

    return transcript;
  } catch (error) {
    // Secure cleanup on error
    VoiceInputSecurity.secureCleanup(audioBlob);
    console.error('Voice input processing failed:', error);
    throw error;
  }
};

// Real-time speech recognition for live transcription
export const startRealTimeSpeechRecognition = (
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void
): (() => void) | null => {
  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Native speech recognition not available');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      if (fullTranscript.trim()) {
        const sanitized = VoiceInputSecurity.sanitizeTranscription(fullTranscript);
        onResult(sanitized, !!finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Real-time speech recognition error:', event.error);
      onError('Speech recognition error: ' + event.error);
    };

    recognition.start();

    // Return stop function
    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
    };
  } catch (error) {
    console.error('Failed to start real-time speech recognition:', error);
    onError('Failed to start speech recognition');
    return null;
  }
};
