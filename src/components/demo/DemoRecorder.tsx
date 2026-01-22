
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export interface DemoRecorderProps {
  maxDuration?: number;
  onEnd: () => void;
  onTranscript: (t: string) => void;
  error?: string | null;
  loadingTranscript?: boolean;
  transcript?: string | null;
}

export const DemoRecorder: React.FC<DemoRecorderProps> = ({
  maxDuration = 60,
  onEnd,
  onTranscript,
  error,
  loadingTranscript,
  transcript
}) => {
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!recording) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s >= maxDuration) {
          setRecording(false);
          onEnd();
          return s;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recording, maxDuration, onEnd]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const handleEndDemo = () => {
    if (window.confirm('Are you sure you want to end the demo early?')) {
      setRecording(false);
      onEnd();
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-8 w-full sm:max-w-lg" aria-label="Demo Recorder">
      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span 
              className="inline-block w-3 h-3 rounded-full bg-red-600 animate-pulse" 
              aria-label="Recording Indicator"
            />
            <span className="font-semibold">Recording...</span>
          </div>
          <span 
            aria-live="polite" 
            aria-label={`Elapsed time: ${timeStr}`}
            className="font-mono text-lg"
          >
            {timeStr}
          </span>
        </div>
        
        <Progress
          value={(seconds / maxDuration) * 100}
          aria-label={`Recording Progress: ${Math.round((seconds / maxDuration) * 100)}% complete`}
          className="w-full"
        />
        
        <div className="mt-2">
          <Button
            variant="destructive"
            aria-label="End Demo Early"
            onClick={handleEndDemo}
            className="w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            End Demo Early
          </Button>
        </div>
        
        <div className="mt-4" aria-label="Transcript Area">
          {loadingTranscript ? (
            <div className="flex items-center gap-2" role="status" aria-live="polite">
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" aria-hidden="true" />
              <span>Transcribing your speech...</span>
            </div>
          ) : error ? (
            <div className="text-destructive" role="alert">{error}</div>
          ) : (
            <textarea
              className="w-full min-h-[60px] resize-none rounded border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Transcript will appear here as you speak..."
              value={transcript || ''}
              readOnly
              aria-label="Your Pitch Transcript"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
