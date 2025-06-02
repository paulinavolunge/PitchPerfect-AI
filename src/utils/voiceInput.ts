
import { whisperTranscribe } from '../lib/whisper-api';
import { VoiceInputSecurity } from './voiceInputSecurity';
import { supabase } from '@/lib/supabase';

const nativeSpeechRecognition = async (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Sanitize the transcript before returning
        const sanitizedTranscript = VoiceInputSecurity.sanitizeTranscription(transcript);
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

    // Use native speech recognition if available, otherwise fallback to Whisper
    if (typeof (window as any).webkitSpeechRecognition !== 'undefined') {
      transcript = await nativeSpeechRecognition(audioBlob);
    } else {
      const rawTranscript = await whisperTranscribe(audioBlob);
      transcript = VoiceInputSecurity.sanitizeTranscription(rawTranscript);
    }

    // Secure cleanup
    VoiceInputSecurity.secureCleanup(audioBlob);

    return transcript;
  } catch (error) {
    // Secure cleanup on error
    VoiceInputSecurity.secureCleanup(audioBlob);
    console.error('Voice input processing failed:', error);
    throw error;
  }
};
