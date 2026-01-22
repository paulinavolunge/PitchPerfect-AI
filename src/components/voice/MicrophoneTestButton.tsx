
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, AlertTriangle, CheckCircle } from 'lucide-react';
import { VoiceDebugger } from '@/utils/voiceDebugger';

interface MicrophoneTestButtonProps {
  onTestComplete?: (results: any[]) => void;
}

const MicrophoneTestButton: React.FC<MicrophoneTestButtonProps> = ({ onTestComplete }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    console.log('🔍 Starting voice diagnostics...');
    
    try {
      const diagnosticResults = await VoiceDebugger.runFullDiagnostics();
      setResults(diagnosticResults);
      VoiceDebugger.printSummary();
      onTestComplete?.(diagnosticResults);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const testMicrophoneOnly = async () => {
    setIsRecording(true);
    setAudioLevel(0);
    
    try {
      console.log('🎤 Testing microphone input...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Test with Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!isRecording) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const level = average / 255;
        setAudioLevel(level);
        
        requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      
      // Stop after 5 seconds
      setTimeout(() => {
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        console.log('🎤 Microphone test completed');
      }, 5000);
      
    } catch (error) {
      console.error('🎤 Microphone test failed:', error);
      setIsRecording(false);
    }
  };

  const getStatusIcon = (supported: boolean) => {
    return supported ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (supported: boolean) => {
    return (
      <Badge variant={supported ? "default" : "destructive"} className="ml-2">
        {supported ? "OK" : "FAIL"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Feature Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            className="flex-1"
          >
            {testing ? "Testing..." : "Run Full Diagnostics"}
          </Button>
          
          <Button 
            onClick={testMicrophoneOnly} 
            disabled={isRecording}
            variant="outline"
            className="flex-1"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isRecording ? "Recording..." : "Test Mic"}
          </Button>
        </div>

        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">Audio Level:</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">Speak into your microphone to test audio input</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Test Results:</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.supported)}
                    <span>{result.feature}</span>
                  </div>
                  {getStatusBadge(result.supported)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>This will test microphone access, speech recognition, and audio APIs.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrophoneTestButton;
