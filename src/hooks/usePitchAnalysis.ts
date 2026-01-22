
import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  PitchAnalysisResult, 
  PitchDataPoint, 
  AudioAnalysisConfig, 
  PitchAnalysisError,
  WorkerMessage,
  WorkerResponse
} from '@/types/analysis';

interface UsePitchAnalysisOptions {
  config?: Partial<AudioAnalysisConfig>;
  onError?: (error: PitchAnalysisError) => void;
  throttleMs?: number;
}

interface UsePitchAnalysisReturn {
  analysisResult: PitchAnalysisResult;
  isAnalyzing: boolean;
  error: PitchAnalysisError | null;
  analyzeAudioChunk: (audioData: Float32Array, sampleRate: number) => void;
  startAnalysis: () => void;
  finalizeAnalysis: () => void;
  resetAnalysis: () => void;
  getLatestPitch: () => PitchDataPoint | null;
  getAveragePitch: (timeWindow?: number) => number;
  isWorkerReady: boolean;
}

export const usePitchAnalysis = (options: UsePitchAnalysisOptions = {}): UsePitchAnalysisReturn => {
  const [analysisResult, setAnalysisResult] = useState<PitchAnalysisResult>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<PitchAnalysisError | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const lastAnalysisTime = useRef<number>(0);
  const throttleMs = options.throttleMs ?? 50;
  
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/pitchAnalyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      if (options.config) {
        const message: WorkerMessage = {
          type: 'configure',
          payload: { config: options.config }
        };
        workerRef.current.postMessage(message);
      }

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'analysisResult':
            if (Array.isArray(payload)) {
              setAnalysisResult(prev => [...prev, ...payload]);
            }
            break;
            
          case 'analysisComplete':
            setIsAnalyzing(false);
            break;
            
          case 'error':
            if (payload && typeof payload === 'object' && 'message' in payload) {
              const pitchError = new Error(payload.message) as PitchAnalysisError;
              pitchError.code = payload.code;
              pitchError.details = payload.details;
              setError(pitchError);
              setIsAnalyzing(false);
              options.onError?.(pitchError);
            }
            break;
        }
      };

      workerRef.current.onerror = (errorEvent: ErrorEvent) => {
        const pitchError = new Error('Pitch analysis worker failed') as PitchAnalysisError;
        pitchError.code = 'WORKER_ERROR';
        pitchError.details = errorEvent;
        setError(pitchError);
        setIsAnalyzing(false);
        options.onError?.(pitchError);
      };

    } catch (err) {
      const pitchError = new Error('Failed to initialize pitch analysis worker') as PitchAnalysisError;
      pitchError.code = 'WORKER_ERROR';
      pitchError.details = err;
      setError(pitchError);
      options.onError?.(pitchError);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [options.config, options.onError]);

  const analyzeAudioChunk = useCallback((audioData: Float32Array, sampleRate: number): void => {
    if (!workerRef.current || !audioData || audioData.length === 0) {
      return;
    }

    const now = performance.now();
    if (now - lastAnalysisTime.current < throttleMs) {
      return;
    }
    lastAnalysisTime.current = now;

    try {
      if (!(audioData instanceof Float32Array)) {
        throw new Error('Invalid audio data type. Expected Float32Array.');
      }

      if (sampleRate <= 0 || !Number.isFinite(sampleRate)) {
        throw new Error('Invalid sample rate.');
      }

      const message: WorkerMessage = {
        type: 'analyzeChunk',
        payload: {
          audioData: audioData,
          sampleRate: sampleRate,
          timestamp: now
        }
      };

      workerRef.current.postMessage(message);

    } catch (err) {
      const pitchError = new Error('Failed to analyze audio chunk') as PitchAnalysisError;
      pitchError.code = 'INVALID_AUDIO';
      pitchError.details = err;
      setError(pitchError);
      options.onError?.(pitchError);
    }
  }, [throttleMs, options.onError]);

  const startAnalysis = useCallback((): void => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult([]);
  }, []);

  const finalizeAnalysis = useCallback((): void => {
    if (workerRef.current && isAnalyzing) {
      const message: WorkerMessage = { type: 'finalizeAnalysis' };
      workerRef.current.postMessage(message);
    }
  }, [isAnalyzing]);

  const resetAnalysis = useCallback((): void => {
    setAnalysisResult([]);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  const getLatestPitch = useCallback((): PitchDataPoint | null => {
    return analysisResult.length > 0 ? analysisResult[analysisResult.length - 1] : null;
  }, [analysisResult]);

  const getAveragePitch = useCallback((timeWindow?: number): number => {
    if (analysisResult.length === 0) return 0;
    
    let relevantData = analysisResult;
    
    if (timeWindow && timeWindow > 0) {
      const cutoffTime = (analysisResult[analysisResult.length - 1]?.timestamp || 0) - timeWindow;
      relevantData = analysisResult.filter(point => point.timestamp >= cutoffTime);
    }
    
    if (relevantData.length === 0) return 0;
    
    const sum = relevantData.reduce((acc, point) => acc + point.pitch, 0);
    return sum / relevantData.length;
  }, [analysisResult]);

  return {
    analysisResult,
    isAnalyzing,
    error,
    analyzeAudioChunk,
    startAnalysis,
    finalizeAnalysis,
    resetAnalysis,
    getLatestPitch,
    getAveragePitch,
    isWorkerReady: !!workerRef.current
  };
};
