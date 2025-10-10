
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { usePitchAnalyzer } from '@/hooks/usePitchAnalyzer';
import { PitchVisualizer } from './PitchVisualizer';

export const PitchAnalyzerDemo: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const {
    isAnalyzing,
    currentPitch,
    pitchHistory,
    error,
    startAnalysis,
    stopAnalysis,
    clearHistory
  } = usePitchAnalyzer({
    confidenceThreshold: 0.4,
    minFrequency: 80,
    maxFrequency: 800
  });

  const handleStart = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setStream(mediaStream);
      await startAnalysis(mediaStream);
    } catch (err) {
      console.error('Failed to get microphone access:', err);
    }
  };

  const handleStop = () => {
    stopAnalysis();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleClear = () => {
    clearHistory();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Pitch Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant={isAnalyzing ? "destructive" : "default"}
            onClick={isAnalyzing ? handleStop : handleStart}
            disabled={!!error}
          >
            {isAnalyzing ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Analysis
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleClear}
            disabled={pitchHistory.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        {/* Current pitch display */}
        {currentPitch && currentPitch.frequency > 0 && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-mono font-bold text-blue-600">
                {Math.round(currentPitch.frequency)}
              </div>
              <div className="text-sm text-gray-500">Hz</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-green-600">
                {Math.round(currentPitch.confidence * 100)}
              </div>
              <div className="text-sm text-gray-500">% Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-purple-600">
                {pitchHistory.length}
              </div>
              <div className="text-sm text-gray-500">Data Points</div>
            </div>
          </div>
        )}

        {/* Pitch visualizer */}
        <PitchVisualizer
          pitchHistory={pitchHistory}
          width={600}
          height={200}
          className="w-full"
          showGrid={true}
        />

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Click "Start Analysis" and speak or hum into your microphone</p>
          <p>• The visualizer shows your pitch contour in real-time</p>
          <p>• The system filters out noise and low-confidence detections</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PitchAnalyzerDemo;
