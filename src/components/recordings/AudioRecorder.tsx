
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Pause, Play, Square, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import AudioVisualizer from './AudioVisualizer';
import FileDownload from './FileDownload';

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
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Mic className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          Audio Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main controls - responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="default"
              onClick={isRecording ? handleStopRecording : startRecording}
              disabled={!!error}
              className="gap-2 min-w-[100px]"
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              aria-pressed={isRecording}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Record</span>
                </>
              )}
            </Button>

            {isRecording && (
              <Button
                variant="secondary"
                size="default"
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="gap-2 min-w-[100px]"
                aria-label={isPaused ? "Resume recording" : "Pause recording"}
                aria-pressed={isPaused}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden xs:inline">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden xs:inline">Pause</span>
                  </>
                )}
              </Button>
            )}

            {(audioBlob || audioUrl) && !isRecording && (
              <Button
                variant="outline"
                size="default"
                onClick={clearRecording}
                className="gap-2"
                aria-label="Clear recording"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden xs:inline">Clear</span>
              </Button>
            )}
          </div>

          {/* Duration display */}
          <div 
            className="text-sm font-mono text-muted-foreground"
            aria-live="polite"
            aria-label={`Recording duration: ${formatDuration(duration)} of ${formatDuration(maxDuration)}`}
          >
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className="w-full" 
            aria-label={`Recording progress: ${Math.round(progressPercentage)}%`}
          />
          
          {/* Recording status and visualizer */}
          {(isRecording || isPaused) && (
            <div className="flex items-center gap-2">
              <span 
                className={`text-sm font-medium ${isPaused ? 'text-yellow-600' : 'text-red-600'}`}
                aria-live="polite"
              >
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

        {/* Playback section */}
        {audioUrl && !isRecording && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-sm font-medium">Playback:</label>
              {audioBlob && (
                <FileDownload
                  blob={audioBlob}
                  filename={`recording-${Date.now()}.webm`}
                  variant="outline"
                  size="sm"
                />
              )}
            </div>
            <audio
              controls
              src={audioUrl}
              className="w-full h-12 rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Recorded audio playback"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
