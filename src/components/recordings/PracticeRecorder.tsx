
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Square, Play, AlertTriangle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface PracticeRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void;
  disabled?: boolean;
  maxDuration?: number;
}

export const PracticeRecorder: React.FC<PracticeRecorderProps> = ({
  onRecordingComplete,
  disabled = false,
  maxDuration = 180
}) => {
  const [showInstructions, setShowInstructions] = useState(true);

  const {
    isRecording,
    duration,
    audioBlob,
    audioUrl,
    audioLevel,
    startRecording,
    stopRecording,
    clearRecording,
    error
  } = useAudioRecorder({ maxDuration });

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = useCallback(async () => {
    console.log('🎤 Starting recording...');
    setShowInstructions(false);
    
    try {
      await startRecording();
      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    console.log('🛑 Stopping recording...');
    stopRecording();
    
    if (audioBlob && audioUrl) {
      console.log('📤 Sending recording to parent component');
      onRecordingComplete(audioBlob, audioUrl);
    }
  }, [stopRecording, audioBlob, audioUrl, onRecordingComplete]);

  const handleClearRecording = useCallback(() => {
    console.log('🗑️ Clearing recording');
    clearRecording();
    setShowInstructions(true);
  }, [clearRecording]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Record Your Pitch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <br />
              <small className="text-xs mt-1 block">
                Make sure your browser supports audio recording and microphone access is allowed.
              </small>
            </AlertDescription>
          </Alert>
        )}

        {showInstructions && !isRecording && !audioBlob && (
          <Alert>
            <AlertDescription>
              <strong>Ready to practice?</strong>
              <br />
              Click the record button below and deliver your sales pitch. You'll have up to {Math.floor(maxDuration / 60)} minutes to showcase your skills.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center gap-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={handleStartRecording}
                disabled={disabled}
                size="lg"
                className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={handleStopRecording}
                size="lg"
                variant="destructive"
                className="px-8 py-4"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioBlob && !isRecording && (
              <div className="flex gap-2">
                <Button
                  onClick={handleClearRecording}
                  variant="outline"
                  size="lg"
                >
                  Record Again
                </Button>
              </div>
            )}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-medium">Recording...</span>
              </div>
              
              <div className="text-lg font-mono text-brand-dark">
                {formatDuration(duration)} / {formatDuration(maxDuration)}
              </div>

              {/* Audio Level Indicator */}
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Speak clearly into your microphone</p>
            </div>
          )}

          {/* Playback */}
          {audioUrl && !isRecording && (
            <div className="w-full max-w-md space-y-2">
              <p className="text-sm font-medium text-center">Your Recording:</p>
              <audio
                controls
                src={audioUrl}
                className="w-full"
                preload="metadata"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeRecorder;
