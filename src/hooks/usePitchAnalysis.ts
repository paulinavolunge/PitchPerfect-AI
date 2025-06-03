
import { useState, useCallback, useRef, useEffect } from 'react';
import type { PitchAnalysisResult, PitchDataPoint, AudioAnalysisConfig, PitchAnalysisError } from '@/types/analysis';

interface UsePitchAnalysisOptions {
  config?: Partial<AudioAnalysisConfig>;
  onError?: (error: PitchAnalysisError) => void;
  throttleMs?: number;
}

export const usePitchAnalysis = (options: UsePitchAnalysisOptions = {}) => {
  const [analysisResult, setAnalysisResult] = useState<PitchAnalysisResult>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<PitchAnalysisError | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const lastAnalysisTime = useRef(0);
  const throttleMs = options.throttleMs ?? 50; // Default 50ms throttling
  
  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/pitchAnalyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Configure worker with provided options
      if (options.config) {
        workerRef.current.postMessage({
          type: 'configure',
          payload: options.config
        });
      }

      workerRef.current.onmessage = (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'analysisResult':
            setAnalysisResult(prev => [...prev, ...payload]);
            break;
            
          case 'analysisComplete':
            setIsAnalyzing(false);
            break;
            
          case 'error':
            const pitchError: PitchAnalysisError = new Error(payload.message) as PitchAnalysisError;
            pitchError.code = payload.code;
            pitchError.details = payload.details;
            setError(pitchError);
            setIsAnalyzing(false);
            options.onError?.(pitchError);
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        const pitchError: PitchAnalysisError = new Error('Pitch analysis worker failed') as PitchAnalysisError;
        pitchError.code = 'WORKER_ERROR';
        pitchError.details = error;
        setError(pitchError);
        setIsAnalyzing(false);
        options.onError?.(pitchError);
      };

    } catch (err) {
      const pitchError: PitchAnalysisError = new Error('Failed to initialize pitch analysis worker') as PitchAnalysisError;
      pitchError.code = 'WORKER_ERROR';
      pitchError.details = err;
      setError(pitchError);
      options.onError?.(pitchError);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [options.config, options.onError]);

  const analyzeAudioChunk = useCallback((audioData: Float32Array, sampleRate: number) => {
    if (!workerRef.current || !audioData || audioData.length === 0) {
      return;
    }

    // Throttle analysis calls to prevent excessive processing
    const now = performance.now();
    if (now - lastAnalysisTime.current < throttleMs) {
      return;
    }
    lastAnalysisTime.current = now;

    try {
      // Validate audio data
      if (!(audioData instanceof Float32Array)) {
        throw new Error('Invalid audio data type. Expected Float32Array.');
      }

      if (sampleRate <= 0 || !Number.isFinite(sampleRate)) {
        throw new Error('Invalid sample rate.');
      }

      workerRef.current.postMessage({
        type: 'analyzeChunk',
        payload: {
          audioData: audioData,
          sampleRate: sampleRate,
          timestamp: now
        }
      });

    } catch (err) {
      const pitchError: PitchAnalysisError = new Error('Failed to analyze audio chunk') as PitchAnalysisError;
      pitchError.code = 'INVALID_AUDIO';
      pitchError.details = err;
      setError(pitchError);
      options.onError?.(pitchError);
    }
  }, [throttleMs, options.onError]);

  const startAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult([]);
  }, []);

  const finalizeAnalysis = useCallback(() => {
    if (workerRef.current && isAnalyzing) {
      workerRef.current.postMessage({ type: 'finalizeAnalysis' });
    }
  }, [isAnalyzing]);

  const resetAnalysis = useCallback(() => {
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
