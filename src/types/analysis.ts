
export interface PitchDataPoint {
  timestamp: number; // seconds from start of recording
  pitch: number; // Hz - fundamental frequency
  confidence: number; // 0-1 confidence score
  volume: number; // 0-1 normalized volume level
}

export type PitchAnalysisResult = PitchDataPoint[];

export interface AudioAnalysisConfig {
  sampleRate: number;
  bufferSize: number;
  smoothingFactor: number;
  minConfidence: number;
  pitchRange: {
    min: number; // Hz
    max: number; // Hz
  };
}

export interface PitchAnalysisError extends Error {
  code: 'WORKER_ERROR' | 'INVALID_AUDIO' | 'ANALYSIS_FAILED';
  details?: unknown;
}

export interface WorkerMessage {
  type: 'analyzeChunk' | 'finalizeAnalysis' | 'configure';
  payload?: {
    audioData?: Float32Array;
    sampleRate?: number;
    timestamp?: number;
    config?: Partial<AudioAnalysisConfig>;
  };
}

export interface WorkerResponse {
  type: 'analysisResult' | 'analysisComplete' | 'error';
  payload?: PitchDataPoint[] | {
    message: string;
    code: PitchAnalysisError['code'];
    details?: unknown;
  };
}

export interface AudioProcessingOptions {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
}

export interface VoiceAnalysisMetrics {
  averagePitch: number;
  pitchVariation: number;
  confidenceScore: number;
  volumeLevel: number;
  duration: number;
}
