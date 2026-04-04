
import { whisperTranscribe } from '../lib/whisper-api';
import { VoiceInputSecurity } from './voiceInputSecurity';
import { supabase } from '@/integrations/supabase/client';

// Enhanced audio recording with better browser support
const startAudioRecording = (): Promise<{ recorder: MediaRecorder; stream: MediaStream }> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      console.log('🎤 Microphone access granted');

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

      console.log('🎤 Using MIME type:', mimeType);

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      resolve({ recorder, stream });
    } catch (error) {
      console.error('🎤 Failed to get microphone access:', error);
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
          console.log('🗣️ Native speech recognition result:', sanitizedTranscript);
          resolve(sanitizedTranscript);
        } else {
          reject(new Error('No speech detected'));
        }
      };

      recognition.onerror = (event: any) => {
        hasResult = true;
        clearTimeout(timeoutId);
        console.error('🗣️ Speech recognition error:', event.error);
        reject(new Error('Speech recognition failed: ' + event.error));
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        if (!hasResult) {
          reject(new Error('Speech recognition ended without result'));
        }
      };

      recognition.start();
      console.log('🗣️ Native speech recognition started');
    } catch (error) {
      reject(error);
    }
  });
};

export const processVoiceInput = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('🎙️ Processing voice input, blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    // Get current user for rate limiting (guests are allowed)
    const { data: { user } } = await supabase.auth.getUser();
    const rateLimitId = user?.id ?? `guest-${sessionStorage.getItem('guest_session_id') ?? (() => { const id = crypto.randomUUID(); sessionStorage.setItem('guest_session_id', id); return id; })()}`;

    // Check rate limiting (applies to both authenticated users and guests)
    if (VoiceInputSecurity.isRateLimited(rateLimitId)) {
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
    console.log('🤖 Using Whisper API for transcription');
    const rawTranscript = await whisperTranscribe(audioBlob);
    const transcript = VoiceInputSecurity.sanitizeTranscription(rawTranscript);

    console.log('✅ Voice processing complete, transcript:', transcript);

    // Secure cleanup
    VoiceInputSecurity.secureCleanup(audioBlob);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('No speech detected in audio');
    }

    return transcript;
  } catch (error) {
    // Secure cleanup on error
    VoiceInputSecurity.secureCleanup(audioBlob);
    console.error('❌ Voice input processing failed:', error);
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
      console.warn('🗣️ Native speech recognition not available');
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
      console.error('🗣️ Real-time speech recognition error:', event.error);
      onError('Speech recognition error: ' + event.error);
    };

    recognition.start();
    console.log('🗣️ Real-time speech recognition started');

    // Return stop function
    return () => {
      try {
        recognition.stop();
        console.log('🗣️ Real-time speech recognition stopped');
      } catch (error) {
        console.warn('⚠️ Error stopping speech recognition:', error);
      }
    };
  } catch (error) {
    console.error('❌ Failed to start real-time speech recognition:', error);
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
      console.warn('🎤 Already recording');
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
          console.log('🎵 Audio chunk received, size:', event.data.size);
        }
      };

      this.recorder.onstop = () => {
        console.log('🛑 Recording stopped');
        this.isRecording = false;
      };

      this.recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        this.isRecording = false;
      };

      // Collect data in 250ms chunks for more reliable capture
      this.recorder.start(250);
      console.log('🎤 Recording started successfully');

    } catch (error) {
      this.isRecording = false;
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || !this.isRecording) {
        reject(new Error('Not currently recording'));
        return;
      }

      const mimeType = this.recorder.mimeType || 'audio/webm';

      this.recorder.onstop = () => {
        try {
          console.log('🛑 Recording stopped, chunks:', this.audioChunks.length,
            'total size:', this.audioChunks.reduce((s, c) => s + c.size, 0));

          if (this.audioChunks.length === 0) {
            reject(new Error('No audio data recorded'));
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          console.log('🎵 Audio blob created, size:', audioBlob.size, 'type:', audioBlob.type);

          // Clean up
          this.cleanup();

          resolve(audioBlob);
        } catch (error) {
          this.cleanup();
          reject(error);
        }
      };

      // Flush any buffered audio data before stopping.
      // Some browsers don't fire a final dataavailable on stop()
      // if timeslice was used, so requestData() forces it out first.
      try {
        this.recorder.requestData();
      } catch (_) {
        // requestData() may throw if state is not 'recording' on some browsers
      }

      this.recorder.stop();
    });
  }

  private cleanup(): void {
    console.log('🧹 Starting VoiceRecordingManager cleanup...');
    
    // Stop all media tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind, track.readyState);
      });
      this.stream = null;
    }
    
    // Clear recorder
    if (this.recorder) {
      this.recorder.ondataavailable = null;
      this.recorder.onstop = null;
      this.recorder.onerror = null;
      this.recorder = null;
    }
    
    // Clear audio chunks to free memory
    this.audioChunks = [];
    this.isRecording = false;
    
    console.log('🧹 VoiceRecordingManager cleanup complete');
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}
