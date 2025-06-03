interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  noiseThreshold?: number;
}

interface SpeechSynthesisConfig {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface VoiceRecognitionCallbacks {
  onResult: (result: VoiceRecognitionResult) => void;
  onError: (error: VoiceServiceError) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface SpeechSynthesisCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: VoiceServiceError) => void;
}

interface VoiceServiceError extends Error {
  code: 'NOT_SUPPORTED' | 'PERMISSION_DENIED' | 'NO_SPEECH' | 'AUDIO_CAPTURE' | 'NETWORK' | 'UNKNOWN';
  message: string;
  originalError?: Event | Error;
}

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isRecording = false;
  private isSupported = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  constructor() {
    this.checkSupport();
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  private checkSupport(): void {
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    this.isSupported = hasSpeechRecognition && hasSpeechSynthesis;
  }

  private initializeSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
    }
  }

  private initializeSpeechSynthesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  async initializeAudioAnalysis(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }
      
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
      throw error;
    }
  }

  getAudioLevel(): number {
    if (!this.analyser) return 0;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    
    return sum / bufferLength / 255;
  }

  async startRecording(
    config: VoiceServiceConfig = {},
    callbacks: VoiceRecognitionCallbacks
  ): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      const error = new Error('Speech recognition not supported') as VoiceServiceError;
      error.code = 'NOT_SUPPORTED';
      error.name = 'VoiceServiceError';
      throw error;
    }

    if (this.isRecording) {
      this.stopRecording();
    }

    try {
      await this.initializeAudioAnalysis();
      
      this.recognition.continuous = config.continuous ?? true;
      this.recognition.interimResults = config.interimResults ?? true;
      this.recognition.lang = config.language ?? 'en-US';
      this.recognition.maxAlternatives = config.maxAlternatives ?? 1;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        callbacks.onResult({
          transcript: fullTranscript,
          confidence: event.results[0]?.[0]?.confidence ?? 0,
          isFinal: !!finalTranscript
        });
      };

      this.recognition.onerror = (event: SpeechRecognitionError) => {
        let errorCode: VoiceServiceError['code'] = 'UNKNOWN';
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorCode = 'PERMISSION_DENIED';
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'no-speech':
            errorCode = 'NO_SPEECH';
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorCode = 'AUDIO_CAPTURE';
            errorMessage = 'Audio capture failed. Please check your microphone.';
            break;
          case 'network':
            errorCode = 'NETWORK';
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        const error = new Error(errorMessage) as VoiceServiceError;
        error.code = errorCode;
        error.name = 'VoiceServiceError';
        error.originalError = event;
        
        callbacks.onError(error);
        this.isRecording = false;
      };

      this.recognition.onstart = () => {
        callbacks.onStart?.();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.cleanup();
        callbacks.onEnd?.();
      };

      this.recognition.start();
      this.isRecording = true;
    } catch (error) {
      const serviceError = new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`) as VoiceServiceError;
      serviceError.code = 'UNKNOWN';
      serviceError.name = 'VoiceServiceError';
      serviceError.originalError = error instanceof Error ? error : undefined;
      throw serviceError;
    }
  }

  stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.microphone = null;
  }

  async speak(
    text: string, 
    config: SpeechSynthesisConfig = {},
    callbacks: SpeechSynthesisCallbacks = {}
  ): Promise<void> {
    if (!this.synthesis) {
      const error = new Error('Speech synthesis not supported') as VoiceServiceError;
      error.code = 'NOT_SUPPORTED';
      throw error;
    }

    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.rate = config.rate ?? 1;
      utterance.pitch = config.pitch ?? 1;
      utterance.volume = config.volume ?? 0.8;
      
      if (config.voice) {
        const voices = this.synthesis!.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(config.voice!.toLowerCase())
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        callbacks.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        callbacks.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        const error = new Error(`Speech synthesis error: ${event.error}`) as VoiceServiceError;
        error.code = 'UNKNOWN';
        error.originalError = event;
        callbacks.onError?.(error);
        reject(error);
      };

      this.currentUtterance = utterance;
      this.synthesis!.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis?.getVoices() ?? [];
  }

  dispose(): void {
    this.stopRecording();
    this.stopSpeaking();
    this.cleanup();
  }
}

export const voiceService = new VoiceService();
