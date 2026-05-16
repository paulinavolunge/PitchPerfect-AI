import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MIN_DURATION_SECONDS = 10;

export interface RecorderProps {
  /** Passed back to onComplete so callers can link the blob to the right scenario */
  scenarioId: string;
  /** Called with the recorded blob and elapsed seconds after a valid recording */
  onComplete: (blob: Blob, durationSeconds: number) => Promise<void>;
  disabled?: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ scenarioId: _scenarioId, onComplete, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /**
   * Wraps MediaRecorder.stop() in a Promise that resolves inside onstop.
   *
   * iOS Safari 15+ fires onstop inconsistently (~40% miss rate) when the
   * caller awaits stop() synchronously (Apple Developer Forums thread 694207).
   * Resolving inside the onstop handler ensures the blob is assembled before
   * we proceed. The 3-second setTimeout is a hard fallback for the miss case.
   */
  const stopAndGetBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mr = mediaRecorderRef.current;
      if (!mr) return reject(new Error('no_recorder'));

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        if (blob.size < 1000) return reject(new Error('empty_blob'));
        resolve(blob);
      };
      mr.onerror = (e) => reject(e);
      mr.stop();

      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          resolve(new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' }));
        } else {
          reject(new Error('onstop_timeout'));
        }
      }, 3000);
    });
  }, []);

  const start = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(1000);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
      } else if (msg.includes('NotFoundError')) {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Could not start recording. Please try again.');
      }
    }
  }, []);

  const stop = useCallback(async () => {
    if (!isRecording) return;

    setIsRecording(false);
    // Capture elapsed BEFORE stopping the timer
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    // Clear the interval; stream tracks stop AFTER mr.stop() to avoid spurious onstop
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Client-side minimum duration gate (before any async work)
    if (elapsed < MIN_DURATION_SECONDS) {
      toast.error('Recording was too short — try again with at least 10 seconds.');
      // Cleanly stop the recorder and discard
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') mr.stop();
      stopStream();
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      setDuration(0);
      return;
    }

    setIsProcessing(true);
    try {
      // stopAndGetBlob calls mr.stop() and resolves inside onstop (iOS Safari safe).
      // Stream tracks are stopped after, so they don't prematurely fire onstop.
      const blob = await stopAndGetBlob();
      stopStream();
      // Only INSERT after blob is confirmed — not at start()
      await onComplete(blob, elapsed);
    } catch (err: unknown) {
      stopStream();
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'empty_blob' || msg === 'onstop_timeout') {
        toast.error('Recording was empty — please try again.');
      } else {
        setError('Failed to process recording. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      setDuration(0);
      chunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  }, [isRecording, stopStream, stopAndGetBlob, onComplete]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isRecording && !isProcessing && (
          <Button
            onClick={start}
            disabled={disabled}
            size="lg"
            className="bg-brand-green hover:bg-brand-green/90 text-white gap-2"
          >
            <Mic className="h-5 w-5" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={stop} size="lg" variant="destructive" className="gap-2">
            <Square className="h-5 w-5" />
            Stop ({formatDuration(duration)})
          </Button>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            Processing…
          </div>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span>
            Recording
            {duration < MIN_DURATION_SECONDS
              ? ` — ${MIN_DURATION_SECONDS - duration}s minimum remaining`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default Recorder;
