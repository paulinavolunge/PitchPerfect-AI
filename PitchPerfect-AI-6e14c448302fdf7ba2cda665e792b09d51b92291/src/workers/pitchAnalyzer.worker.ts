
import type { 
  PitchDataPoint, 
  AudioAnalysisConfig, 
  WorkerMessage, 
  WorkerResponse 
} from '../types/analysis';

class PitchAnalyzer {
  private config: AudioAnalysisConfig = {
    sampleRate: 44100,
    bufferSize: 4096,
    smoothingFactor: 0.8,
    minConfidence: 0.3,
    pitchRange: { min: 80, max: 1000 }
  };
  
  private startTime = 0;
  private lastTimestamp = 0;

  configure(newConfig: Partial<AudioAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private detectPitch(audioData: Float32Array, sampleRate: number): { pitch: number; confidence: number } {
    const bufferSize = audioData.length;
    const minPeriod = Math.floor(sampleRate / this.config.pitchRange.max);
    const maxPeriod = Math.floor(sampleRate / this.config.pitchRange.min);
    
    if (maxPeriod >= bufferSize) {
      return { pitch: 0, confidence: 0 };
    }

    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
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
    
    const pitch = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
    const confidence = Math.min(bestCorrelation, 1);
    
    return { pitch, confidence };
  }

  private calculateVolume(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  analyzeChunk(audioData: Float32Array, sampleRate: number, timestamp: number): PitchDataPoint | null {
    try {
      if (audioData.length === 0) {
        return null;
      }

      const { pitch, confidence } = this.detectPitch(audioData, sampleRate);
      const volume = this.calculateVolume(audioData);
      
      if (confidence < this.config.minConfidence) {
        return null;
      }

      return {
        timestamp: timestamp / 1000,
        pitch,
        confidence,
        volume
      };
    } catch (error) {
      console.error('Pitch detection error:', error);
      return null;
    }
  }

  reset(): void {
    this.startTime = performance.now();
    this.lastTimestamp = 0;
  }
}

const analyzer = new PitchAnalyzer();

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'configure':
        if (payload?.config) {
          analyzer.configure(payload.config);
        }
        break;
        
      case 'analyzeChunk': {
        if (payload?.audioData && payload?.sampleRate && payload?.timestamp) {
          const result = analyzer.analyzeChunk(payload.audioData, payload.sampleRate, payload.timestamp);
          
          if (result) {
            const response: WorkerResponse = {
              type: 'analysisResult',
              payload: [result]
            };
            self.postMessage(response);
          }
        }
        break;
      }
      
      case 'finalizeAnalysis': {
        analyzer.reset();
        const response: WorkerResponse = {
          type: 'analysisComplete'
        };
        self.postMessage(response);
        break;
      }
      
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'WORKER_ERROR'
      }
    };
    self.postMessage(response);
  }
};
