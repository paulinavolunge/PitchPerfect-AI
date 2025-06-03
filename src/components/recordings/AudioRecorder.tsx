
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Pause, Play, Square, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import AudioVisualizer from './AudioVisualizer';

interface AudioRecorderProps {
  maxDuration?: number;
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  maxDuration = 180,
  onRecordingComplete,
  className
}) => {
  const {
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
  } = useAudioRecorder({ maxDuration });

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStopRecording = () => {
    stopRecording();
    if (audioBlob && audioUrl && onRecordingComplete) {
      onRecordingComplete(audioBlob, audioUrl);
    }
  };

  const progressPercentage = (duration / maxDuration) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Audio Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={isRecording ? handleStopRecording : startRecording}
              disabled={!!error}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Record
                </>
              )}
            </Button>

            {isRecording && (
              <Button
                variant="secondary"
                size="sm"
                onClick={isPaused ? resumeRecording : pauseRecording}
                aria-label={isPaused ? "Resume recording" : "Pause recording"}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
            )}

            {(audioBlob || audioUrl) && !isRecording && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearRecording}
                aria-label="Clear recording"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          <div className="text-sm font-mono">
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progressPercentage} className="w-full" />
          
          {(isRecording || isPaused) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isPaused ? 'Paused' : 'Recording'}
              </span>
              <AudioVisualizer
                audioLevel={audioLevel}
                isRecording={isRecording && !isPaused}
                width={200}
                height={40}
                className="flex-1"
              />
            </div>
          )}
        </div>

        {audioUrl && !isRecording && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Playback:</label>
            <audio
              controls
              src={audioUrl}
              className="w-full"
              aria-label="Recorded audio playback"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
