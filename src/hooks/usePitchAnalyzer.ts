import { useState, useRef, useCallback, useEffect } from 'react';
import type { 
  PitchData, 
  PitchAnalyzerConfig, 
  UsePitchAnalyzerReturn 
} from '@/types/pitch';

const DEFAULT_CONFIG: Required<PitchAnalyzerConfig> = {
  bufferSize: 4096,
  smoothingTimeConstant: 0.8,
  minFrequency: 80,
  maxFrequency: 1000,
  confidenceThreshold: 0.3
};

export const usePitchAnalyzer = (
  config: PitchAnalyzerConfig = {}
): UsePitchAnalyzerReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchHistory, setPitchHistory] = useState<PitchData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  // Robust auto-correlation pitch detection algorithm
  const autoCorrelate = useCallback((buffer: Float32Array, sampleRate: number): PitchData => {
    const bufferSize = buffer.length;
    const minPeriod = Math.floor(sampleRate / finalConfig.maxFrequency);
    const maxPeriod = Math.floor(sampleRate / finalConfig.minFrequency);
    
    // Check for silence
    let rms = 0;
    for (let i = 0; i < bufferSize; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / bufferSize);
    
    if (rms < 0.01) {
      return { frequency: 0, confidence: 0, timestamp: Date.now() };
    }

    let bestPeriod = 0;
    let bestCorrelation = 0;
    
    // Auto-correlation
    for (let period = minPeriod; period <= Math.min(maxPeriod, bufferSize / 2); period++) {
      let correlation = 0;
      let normalizer = 0;
      
      for (let i = 0; i < bufferSize - period; i++) {
        correlation += buffer[i] * buffer[i + period];
        normalizer += buffer[i] * buffer[i];
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
    const confidence = Math.min(bestCorrelation, 1);
    
    return { 
      frequency, 
      confidence, 
      timestamp: Date.now() 
    };
  }, [finalConfig.maxFrequency, finalConfig.minFrequency]);

  // Analysis loop
  const analyze = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isAnalyzing) {
      return;
    }

    try {
      analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
      const pitchData = autoCorrelate(dataArrayRef.current, audioContextRef.current!.sampleRate);
      
      // Only update if confidence is above threshold
      if (pitchData.confidence >= finalConfig.confidenceThreshold) {
        setCurrentPitch(pitchData);
        setPitchHistory(prev => {
          const newHistory = [...prev, pitchData];
          // Keep only last 100 data points for performance
          return newHistory.slice(-100);
        });
      }
      
      rafRef.current = requestAnimationFrame(analyze);
    } catch (err) {
      setError(`Analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, autoCorrelate, finalConfig.confidenceThreshold]);

  const startAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      setError(null);
      
      if (!stream || !stream.active) {
        throw new Error('Invalid or inactive media stream');
      }

      // Check browser support
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      // Initialize audio context
      audioContextRef.current = new AudioContextClass();
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Set up analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = finalConfig.bufferSize;
      analyserRef.current.smoothingTimeConstant = finalConfig.smoothingTimeConstant;
      
      // Connect audio source
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      // Initialize data array
      const buf = new ArrayBuffer(analyserRef.current.fftSize * Float32Array.BYTES_PER_ELEMENT);
      dataArrayRef.current = new Float32Array(buf);
      // Store stream reference
      streamRef.current = stream;
      
      setIsAnalyzing(true);
      analyze();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start pitch analysis';
      setError(errorMessage);
      setIsAnalyzing(false);
    }
  }, [analyze, finalConfig.bufferSize, finalConfig.smoothingTimeConstant]);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    dataArrayRef.current = null;
    streamRef.current = null;
    
    setCurrentPitch(null);
  }, []);

  const clearHistory = useCallback(() => {
    setPitchHistory([]);
    setCurrentPitch(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  return {
    isAnalyzing,
    currentPitch,
    pitchHistory,
    error,
    startAnalysis,
    stopAnalysis,
    clearHistory
  };
};
