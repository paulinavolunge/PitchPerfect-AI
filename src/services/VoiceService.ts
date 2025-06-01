
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

export class VoiceService {
  private recognition: any = null;
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
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
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

      // Fix TypeScript error by properly typing AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      throw new Error('Speech recognition not supported');
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

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        onResult(fullTranscript, !!finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            errorMessage = 'Microphone access denied. Please allow microphone permissions.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture failed. Please check your microphone.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        onError(errorMessage);
        this.isRecording = false;
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.cleanup();
      };

      this.recognition.start();
      this.isRecording = true;
    } catch (error) {
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }

    // Stop any ongoing speech
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
        onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        const errorMessage = `Speech synthesis error: ${event.error}`;
        onError?.(errorMessage);
        reject(new Error(errorMessage));
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
