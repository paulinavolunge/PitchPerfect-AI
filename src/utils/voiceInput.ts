
import { whisperTranscribe } from '../lib/whisper-api';
import { VoiceInputSecurity } from './voiceInputSecurity';
import { supabase } from '@/integrations/supabase/client';

const nativeSpeechRecognition = async (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const sanitizedTranscript = VoiceInputSecurity.sanitizeTranscription(transcript);
        console.log('Native speech recognition result:', sanitizedTranscript);
        resolve(sanitizedTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error('Speech recognition failed: ' + event.error));
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

export const processVoiceInput = async (audioBlob: Blob) => {
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

    // Try native speech recognition first if available
    if (typeof (window as any).webkitSpeechRecognition !== 'undefined') {
      console.log('Using native speech recognition');
      try {
        transcript = await nativeSpeechRecognition(audioBlob);
      } catch (error) {
        console.warn('Native speech recognition failed, falling back to Whisper:', error);
        const rawTranscript = await whisperTranscribe(audioBlob);
        transcript = VoiceInputSecurity.sanitizeTranscription(rawTranscript);
      }
    } else {
      console.log('Using Whisper API fallback');
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
