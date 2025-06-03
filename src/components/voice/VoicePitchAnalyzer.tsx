
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Activity } from 'lucide-react';
import { usePitchAnalysis } from '@/hooks/usePitchAnalysis';
import type { PitchDataPoint } from '@/types/analysis';

interface VoicePitchAnalyzerProps {
  audioStream?: MediaStream;
  isRecording: boolean;
  onPitchUpdate?: (pitch: PitchDataPoint) => void;
  className?: string;
}

const VoicePitchAnalyzer: React.FC<VoicePitchAnalyzerProps> = ({
  audioStream,
  isRecording,
  onPitchUpdate,
  className
}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    analysisResult,
    isAnalyzing,
    error,
    analyzeAudioChunk,
    startAnalysis,
    finalizeAnalysis,
    resetAnalysis,
    getLatestPitch,
    getAveragePitch
  } = usePitchAnalysis({
    config: {
      sampleRate: 44100,
      bufferSize: 4096,
      minConfidence: 0.3,
      pitchRange: { min: 80, max: 800 }
    },
    onError: (error) => {
      console.error('Pitch analysis error:', error);
    },
    throttleMs: 100 // Analyze every 100ms
  });

  // Initialize audio analysis when stream is available
  useEffect(() => {
    if (audioStream && !isInitialized) {
      initializeAudioAnalysis();
    }
    
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioStream, isInitialized]);

  // Start/stop analysis based on recording state
  useEffect(() => {
    if (isRecording && isInitialized) {
      startAnalysis();
      processAudioFrames();
    } else if (!isRecording && isAnalyzing) {
      finalizeAnalysis();
    }
  }, [isRecording, isInitialized, isAnalyzing]);

  // Notify parent component of pitch updates
  useEffect(() => {
    const latestPitch = getLatestPitch();
    if (latestPitch && onPitchUpdate) {
      onPitchUpdate(latestPitch);
    }
  }, [analysisResult, onPitchUpdate]);

  const initializeAudioAnalysis = useCallback(async () => {
    try {
      if (!audioStream) return;

      const context = new AudioContext();
      const analyserNode = context.createAnalyser();
      
      analyserNode.fftSize = 4096;
      analyserNode.smoothingTimeConstant = 0.8;
      
      const source = context.createMediaStreamSource(audioStream);
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      setIsInitialized(true);
      
    } catch (err) {
      console.error('Failed to initialize audio analysis:', err);
    }
  }, [audioStream]);

  const processAudioFrames = useCallback(() => {
    if (!analyser || !isRecording) return;

    const dataArray = new Float32Array(analyser.fftSize);
    
    const process = () => {
      if (!isRecording || !analyser) return;
      
      analyser.getFloatTimeDomainData(dataArray);
      analyzeAudioChunk(dataArray, audioContext?.sampleRate || 44100);
      
      requestAnimationFrame(process);
    };
    
    process();
  }, [analyser, isRecording, analyzeAudioChunk, audioContext]);

  const latestPitch = getLatestPitch();
  const averagePitch = getAveragePitch(5); // Last 5 seconds
  const pitchStability = analysisResult.length > 1 ? 
    Math.max(0, 1 - (Math.abs(latestPitch?.pitch || 0 - averagePitch) / averagePitch)) : 0;

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Pitch analysis error: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Voice Pitch Analysis
          {isAnalyzing && <Badge variant="default" className="text-xs">Live</Badge>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {latestPitch ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Pitch:</span>
                <div className="font-mono text-lg">{latestPitch.pitch.toFixed(1)} Hz</div>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <div className="flex items-center gap-2">
                  <Progress value={latestPitch.confidence * 100} className="flex-1" />
                  <span className="font-mono text-sm">
                    {(latestPitch.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Average Pitch:</span>
                <div className="font-mono">{averagePitch.toFixed(1)} Hz</div>
              </div>
              <div>
                <span className="text-muted-foreground">Stability:</span>
                <div className="flex items-center gap-2">
                  <Progress value={pitchStability * 100} className="flex-1" />
                  <span className="font-mono text-sm">
                    {(pitchStability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Data points: {analysisResult.length} | 
              Duration: {latestPitch.timestamp.toFixed(1)}s
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {isRecording ? 'Analyzing voice...' : 'Start recording to see pitch analysis'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoicePitchAnalyzer;
