
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Check, X } from 'lucide-react';
import { Button } from './ui/button';

interface MicrophoneTestProps {
  onTestComplete: (passed: boolean) => void;
  autoStart?: boolean;
}

const MicrophoneTest = ({ onTestComplete, autoStart = true }: MicrophoneTestProps) => {
  const [isRecording, setIsRecording] = useState(autoStart);
  const [inputDetected, setInputDetected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [testComplete, setTestComplete] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Start microphone and audio analysis
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Create audio context and analyzer
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      setIsRecording(true);
      
      // Start visualization
      drawVisualizer();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setInputDetected(false);
      onTestComplete(false);
      setTestComplete(true);
    }
  };
  
  // Stop recording and release resources
  const stopRecording = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    analyserRef.current = null;
  };
  
  // Draw audio waveform visualization
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyserRef.current?.getByteFrequencyData(dataArray);
      
      // Clear canvas
      canvasCtx.fillStyle = 'rgb(249, 250, 251)';
      canvasCtx.fillRect(0, 0, width, height);
      
      // Check if we have audio input (detect if values are above noise floor)
      const audioDetected = dataArray.some(value => value > 25);
      setInputDetected(audioDetected);
      
      // Draw waveform
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        // Use green color when input is detected, otherwise use red
        canvasCtx.fillStyle = audioDetected ? 
          'rgb(34, 197, 94)' : 
          'rgb(239, 68, 68)';
        
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    
    draw();
  };
  
  // Countdown timer effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (isRecording && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && !testComplete) {
      setTestComplete(true);
      onTestComplete(inputDetected);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isRecording, timeLeft, inputDetected, testComplete, onTestComplete]);
  
  // Start recording on mount if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
    
    return () => {
      stopRecording();
    };
  }, [autoStart]);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-brand-blue/10 pb-4">
        <CardTitle className="text-xl text-brand-dark flex items-center justify-between">
          <span>Microphone Check</span>
          {isRecording ? (
            <Mic className="h-5 w-5 text-brand-green animate-pulse" />
          ) : (
            <MicOff className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {!testComplete ? (
            <>
              <canvas ref={canvasRef} className="w-full h-24 rounded bg-gray-50" />
              
              <div className="flex items-center mt-4 mb-2">
                {inputDetected ? (
                  <div className="flex items-center text-green-600">
                    <Check className="mr-2 h-5 w-5" />
                    <span>We hear you!</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <X className="mr-2 h-5 w-5" />
                    <span>No input detected</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-lg font-medium">Testing in: {timeLeft}s</p>
                <p className="text-sm text-gray-500 mt-1">Please say something...</p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              {inputDetected ? (
                <div className="text-green-600">
                  <Check className="mx-auto h-12 w-12 mb-2" />
                  <p className="text-lg font-medium">Microphone working!</p>
                </div>
              ) : (
                <div className="text-red-500">
                  <X className="mx-auto h-12 w-12 mb-2" />
                  <p className="text-lg font-medium">No microphone input detected</p>
                  <p className="text-sm mt-2">Please check your microphone settings and try again.</p>
                </div>
              )}
              
              {!inputDetected && (
                <Button 
                  onClick={() => {
                    setTestComplete(false);
                    setTimeLeft(5);
                    startRecording();
                  }}
                  className="mt-4"
                >
                  Test Again
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrophoneTest;
