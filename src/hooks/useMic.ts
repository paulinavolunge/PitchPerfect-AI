import { useCallback, useEffect, useRef, useState } from 'react';
import { createMicStream, stopMicStream } from '@/audio/recorder/MicTransport';

export interface UseMicOptions {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface UseMicApi {
  isActive: boolean;
  streamId: string | null;
  start: () => Promise<void>;
  stop: () => void;
  // toggles (apply on next start)
  echoCancellation: boolean;
  setEchoCancellation: (value: boolean) => void;
  noiseSuppression: boolean;
  setNoiseSuppression: (value: boolean) => void;
  autoGainControl: boolean;
  setAutoGainControl: (value: boolean) => void;
  // optional attachment for preview/debug
  attachToElement: (el: HTMLMediaElement | null) => void;
}

export function useMic(options: UseMicOptions = {}): UseMicApi {
  const [echoCancellation, setEchoCancellation] = useState(options.echoCancellation ?? true);
  const [noiseSuppression, setNoiseSuppression] = useState(options.noiseSuppression ?? true);
  const [autoGainControl, setAutoGainControl] = useState(options.autoGainControl ?? true);

  const [isActive, setIsActive] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const attachedElRef = useRef<HTMLMediaElement | null>(null);
  const initInFlightRef = useRef(false);

  const attachToElement = useCallback((el: HTMLMediaElement | null) => {
    attachedElRef.current = el;
    const stream = streamRef.current;
    if (el && stream) {
      try {
        (el as any).srcObject = stream;
        if (typeof (el as any).play === 'function') {
          // Best-effort play; ignore errors in tests/SSR
          (el as any).play?.().catch?.(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const start = useCallback(async () => {
    if (initInFlightRef.current) return;
    if (streamRef.current && streamRef.current.getTracks().some(t => t.readyState === 'live')) {
      // Already active, do not double-init
      return;
    }
    initInFlightRef.current = true;
    try {
      const stream = await createMicStream({
        echoCancellation,
        noiseSuppression,
        autoGainControl,
      });
      streamRef.current = stream;
      setStreamId(stream.id || null);
      setIsActive(true);
      const el = attachedElRef.current;
      if (el) {
        try {
          (el as any).srcObject = stream;
          (el as any).play?.().catch?.(() => {});
        } catch {
          // ignore
        }
      }
    } finally {
      initInFlightRef.current = false;
    }
  }, [echoCancellation, noiseSuppression, autoGainControl]);

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stopMicStream(stream);
    }
    const el = attachedElRef.current;
    if (el && (el as any).srcObject) {
      try {
        (el as any).srcObject = null;
      } catch {
        // ignore
      }
    }
    streamRef.current = null;
    setIsActive(false);
    setStreamId(null);
  }, []);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stop();
    };
  }, [stop]);

  return {
    isActive,
    streamId,
    start,
    stop,
    echoCancellation,
    setEchoCancellation,
    noiseSuppression,
    setNoiseSuppression,
    autoGainControl,
    setAutoGainControl,
    attachToElement,
  };
}