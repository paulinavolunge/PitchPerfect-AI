
import type { PitchAnalysisResult, PitchDataPoint, AudioAnalysisConfig } from '@/types/analysis';

export class PitchAnalysisService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Float32Array | null = null;
  private isActive = false;
  private onAnalysisCallback?: (data: PitchDataPoint) => void;
  private animationFrameId?: number;

  constructor(private config: Partial<AudioAnalysisConfig> = {}) {}

  async initialize(stream: MediaStream): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyser.fftSize = this.config.bufferSize || 4096;
      this.analyser.smoothingTimeConstant = this.config.smoothingFactor || 0.8;
      
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      this.dataArray = new Float32Array(this.analyser.fftSize);
      
    } catch (error) {
      throw new Error(`Failed to initialize pitch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  startAnalysis(onAnalysis: (data: PitchDataPoint) => void): void {
    if (!this.audioContext || !this.analyser || !this.dataArray) {
      throw new Error('Pitch analysis not initialized');
    }

    this.onAnalysisCallback = onAnalysis;
    this.isActive = true;
    this.processAudio();
  }

  private processAudio = (): void => {
    if (!this.isActive || !this.analyser || !this.dataArray || !this.audioContext) {
      return;
    }

    this.analyser.getFloatTimeDomainData(this.dataArray);
    
    // Process audio data for pitch detection
    if (this.onAnalysisCallback) {
      const pitch = this.detectPitch(this.dataArray, this.audioContext.sampleRate);
      const volume = this.calculateVolume(this.dataArray);
      
      if (pitch.confidence > (this.config.minConfidence || 0.3)) {
        const dataPoint: PitchDataPoint = {
          timestamp: this.audioContext.currentTime,
          pitch: pitch.frequency,
          confidence: pitch.confidence,
          volume: volume
        };
        
        this.onAnalysisCallback(dataPoint);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.processAudio);
  };

  private detectPitch(audioData: Float32Array, sampleRate: number): { frequency: number; confidence: number } {
    // Simple autocorrelation pitch detection
    const bufferSize = audioData.length;
    const minPeriod = Math.floor(sampleRate / 1000); // 1000 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);   // 80 Hz min
    
    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period <= Math.min(maxPeriod, bufferSize / 2); period++) {
      let correlation = 0;
      let normalizer = 0;
      
      for (let i = 0; i < bufferSize - period; i++) {
        correlation += audioData[i] * audioData[i + period];
        normalizer += audioData[i] * audioData[i];
      }
      
      if (normalizer > 0) {
        correlation /= normalizer;
        
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPeriod = period;
        }
      }
    }
    
    const frequency = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
    return { frequency, confidence: Math.min(bestCorrelation, 1) };
  }

  private calculateVolume(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  stopAnalysis(): void {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  dispose(): void {
    this.stopAnalysis();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }
}
