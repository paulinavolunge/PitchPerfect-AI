
import { useState, useRef, useCallback, useEffect } from 'react';
import { ResourceManager } from '@/utils/resourceCleanup';
import { sanitizeFilename } from '@/lib/sanitizeInput';
import { ErrorHandler } from '@/utils/errorHandler';

interface AudioRecorderConfig {
  maxDuration?: number; // seconds
  mimeType?: string;
  audioBitsPerSecond?: number;
}

interface AudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  error: string | null;
}

export const useAudioRecorder = (
  config: AudioRecorderConfig = {}
): AudioRecorderReturn => {
  const {
    maxDuration = 300,
    mimeType = 'audio/webm;codecs=opus',
    audioBitsPerSecond = 128000
  } = config;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup helper
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current) {
      ResourceManager.closeAudioContext(audioContextRef.current);
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      ResourceManager.stopMediaStream(streamRef.current);
      streamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setIsPaused(false);
  }, []);

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255);
    
    if (isRecording && !isPaused) {
      animationRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording, isPaused]);

  // Start Recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      ResourceManager.registerMediaStream(stream);

      // Set up AudioContext for visualization
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }
      
      audioContextRef.current = new AudioContextClass();
      ResourceManager.registerAudioContext(audioContextRef.current);
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm';
      const options: MediaRecorderOptions = {
        mimeType: supportedMimeType,
        audioBitsPerSecond
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedMimeType });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        ResourceManager.registerObjectUrl(url);
        setAudioUrl(url);
        
        cleanup();
      };

      mediaRecorder.onerror = (event) => {
        const errorMessage = `Recording failed: ${(event as any).error?.message || 'Unknown error'}`;
        setError(errorMessage);
        ErrorHandler.logError(new Error(errorMessage), 'AudioRecorder');
        cleanup();
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      // Start audio level monitoring
      monitorAudioLevel();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Provide specific error messages for common issues
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (errorMessage.includes('NotSupportedError')) {
        setError('Audio recording not supported in this browser.');
      } else {
        setError(`Recording failed: ${errorMessage}`);
      }
      
      ErrorHandler.logError(err, 'AudioRecorder.startRecording');
      cleanup();
    }
  }, [cleanup, maxDuration, mimeType, audioBitsPerSecond, monitorAudioLevel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    cleanup();
  }, [cleanup]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      monitorAudioLevel();
    }
  }, [monitorAudioLevel]);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      ResourceManager.revokeObjectUrl(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setAudioLevel(0);
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        ResourceManager.revokeObjectUrl(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    audioLevel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error
  };
};
