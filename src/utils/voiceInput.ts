
import { whisperTranscribe } from '../lib/whisper-api';
import { VoiceInputSecurity } from './voiceInputSecurity';
import { supabase } from '@/integrations/supabase/client';
import { secureLog } from './secureLog';

// Enhanced audio recording with better browser support
const startAudioRecording = (): Promise<{ recorder: MediaRecorder; stream: MediaStream }> => {
  return new Promise(async (resolve, reject) => {
    try {
      secureLog.info('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      secureLog.info('🎤 Microphone access granted');

      // Test different MIME types for MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = ''; // Let browser choose
            }
          }
        }
      }

      secureLog.info('🎤 Using MIME type:', mimeType);

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      resolve({ recorder, stream });
    } catch (error) {
      secureLog.error('🎤 Failed to get microphone access:', error);
      reject(error);
    }
  });
};

// Native speech recognition with improved error handling
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
      }, 8000);

      recognition.onresult = (event: any) => {
        hasResult = true;
        clearTimeout(timeoutId);
        
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          const sanitizedTranscript = VoiceInputSecurity.sanitizeTranscription(transcript);
          secureLog.info('🗣️ Native speech recognition result:', sanitizedTranscript);
          resolve(sanitizedTranscript);
        } else {
          reject(new Error('No speech detected'));
        }
      };

      recognition.onerror = (event: any) => {
        hasResult = true;
        clearTimeout(timeoutId);
        secureLog.error('🗣️ Speech recognition error:', event.error);
        reject(new Error('Speech recognition failed: ' + event.error));
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        if (!hasResult) {
          reject(new Error('Speech recognition ended without result'));
        }
      };

      recognition.start();
      secureLog.info('🗣️ Native speech recognition started');
    } catch (error) {
      reject(error);
    }
  });
};

export const processVoiceInput = async (audioBlob: Blob): Promise<string> => {
  try {
    secureLog.info('🎙️ Processing voice input, blob size:', audioBlob.size, 'type:', audioBlob.type);
    
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

    if (audioBlob.size === 0) {
      throw new Error('No audio data recorded');
    }

    // Always use Whisper for reliable transcription
    secureLog.info('🤖 Using Whisper API for transcription');
    const rawTranscript = await whisperTranscribe(audioBlob);
    const transcript = VoiceInputSecurity.sanitizeTranscription(rawTranscript);

    secureLog.info('✅ Voice processing complete, transcript:', transcript);

    // Secure cleanup
    VoiceInputSecurity.secureCleanup(audioBlob);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No speech detected in audio');
    }

    return transcript;
  } catch (error) {
    // Secure cleanup on error
    VoiceInputSecurity.secureCleanup(audioBlob);
    secureLog.error('❌ Voice input processing failed:', error);
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
      secureLog.warn('🗣️ Native speech recognition not available');
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
      secureLog.error('🗣️ Real-time speech recognition error:', event.error);
      onError('Speech recognition error: ' + event.error);
    };

    recognition.start();
    secureLog.info('🗣️ Real-time speech recognition started');

    // Return stop function
    return () => {
      try {
        recognition.stop();
        secureLog.info('🗣️ Real-time speech recognition stopped');
      } catch (error) {
                  secureLog.warn('⚠️ Error stopping speech recognition:', error);
      }
    };
  } catch (error) {
    secureLog.error('❌ Failed to start real-time speech recognition:', error);
    onError('Failed to start speech recognition');
    return null;
  }
};

// Enhanced recording manager for reliable audio capture
export class VoiceRecordingManager {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      secureLog.warn('🎤 Already recording');
      return;
    }

    try {
      const { recorder, stream } = await startAudioRecording();
      
      this.recorder = recorder;
      this.stream = stream;
      this.audioChunks = [];
      this.isRecording = true;

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          secureLog.info('🎵 Audio chunk received, size:', event.data.size);
        }
      };

              this.recorder.onstop = () => {
        secureLog.info('🛑 Recording stopped');
        this.isRecording = false;
      };

              this.recorder.onerror = (event) => {
        secureLog.error('❌ MediaRecorder error:', event);
        this.isRecording = false;
      };

      // Start recording with data collection every second
      this.recorder.start(1000);
      secureLog.info('🎤 Recording started successfully');

    } catch (error) {
      this.isRecording = false;
      secureLog.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || !this.isRecording) {
        reject(new Error('Not currently recording'));
        return;
      }

      this.recorder.onstop = () => {
        try {
          if (this.audioChunks.length === 0) {
            reject(new Error('No audio data recorded'));
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { 
            type: this.recorder?.mimeType || 'audio/webm' 
          });
          
          secureLog.info('🎵 Audio blob created, size:', audioBlob.size, 'type:', audioBlob.type);
          
          // Clean up
          this.cleanup();
          
          resolve(audioBlob);
        } catch (error) {
          this.cleanup();
          reject(error);
        }
      };

      this.recorder.stop();
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.recorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    secureLog.info('🧹 Recording cleanup complete');
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}
