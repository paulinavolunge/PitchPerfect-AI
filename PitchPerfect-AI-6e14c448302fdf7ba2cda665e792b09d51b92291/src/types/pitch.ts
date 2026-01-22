
export interface PitchData {
  frequency: number;
  confidence: number;
  timestamp: number;
}

export interface PitchAnalyzerConfig {
  bufferSize?: number;
  smoothingTimeConstant?: number;
  minFrequency?: number;
  maxFrequency?: number;
  confidenceThreshold?: number;
}

export interface PitchAnalyzerState {
  isAnalyzing: boolean;
  currentPitch: PitchData | null;
  pitchHistory: PitchData[];
  error: string | null;
}

export interface PitchAnalyzerControls {
  startAnalysis: (stream: MediaStream) => Promise<void>;
  stopAnalysis: () => void;
  clearHistory: () => void;
}

export type UsePitchAnalyzerReturn = PitchAnalyzerState & PitchAnalyzerControls;
