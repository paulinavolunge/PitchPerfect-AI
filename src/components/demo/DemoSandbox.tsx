
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Clock } from 'lucide-react';
import DemoTranscript from './DemoTranscript';
import DemoScorecard from './DemoScorecard';
import { useToast } from '@/hooks/use-toast';
import { getSampleScenario } from '@/utils/demoUtils';

interface DemoSandboxProps {
  onComplete: () => void;
}

enum DemoState {
  INTRO = 'intro',
  RECORDING = 'recording',
  SCORING = 'scoring',
  COMPLETE = 'complete'
}

const DemoSandbox: React.FC<DemoSandboxProps> = ({ onComplete }) => {
  const [demoState, setDemoState] = useState<DemoState>(DemoState.INTRO);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [transcript, setTranscript] = useState<string>('');
  const [scenario, setScenario] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);
  const { toast } = useToast();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || 
                                          window.webkitSpeechRecognition;
                                          
      if (SpeechRecognitionConstructor) {
        recognitionRef.current = new SpeechRecognitionConstructor();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
            
          setTranscript(transcript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast({
            title: "Voice recognition error",
            description: `Error: ${event.error}. Please try again.`,
            variant: "destructive",
          });
        };
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        if (isListening) {
          recognitionRef.current.stop();
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [toast]);

  // Load a sample scenario
  useEffect(() => {
    const loadScenario = async () => {
      const sampleScenario = await getSampleScenario();
      setScenario(sampleScenario);
    };
    
    loadScenario();
  }, []);

  // Handle timer
  useEffect(() => {
    if (demoState === DemoState.RECORDING) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            // Time's up
            clearInterval(timerRef.current!);
            endDemo();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [demoState]);

  const startDemo = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice recognition not supported",
        description: "Your browser does not support voice recognition. Please try a different browser.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setDemoState(DemoState.RECORDING);
      setTimeRemaining(60);
      toast({
        title: "Demo started",
        description: "Start talking about handling pricing objections. You have 60 seconds.",
      });
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast({
        title: "Voice recognition error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive",
      });
    }
  };

  const endDemo = () => {
    // Stop recording
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    // Generate score
    const score = generateScore(transcript);
    setScoreData(score);
    
    // Update state
    setDemoState(DemoState.SCORING);
    
    toast({
      title: "Demo complete",
      description: "Your pitch has been scored. See your results below.",
    });
  };

  const generateScore = (transcript: string) => {
    // This is a simplified version of scoring
    const wordCount = transcript.split(/\s+/).length;
    
    // Score categories
    const clarity = Math.min(Math.floor(wordCount / 15) + 3, 10);
    const confidence = Math.min(Math.floor(Math.random() * 3) + 7, 10);
    const handling = Math.min(Math.floor(Math.random() * 4) + 6, 10);
    const vocabulary = Math.min(Math.floor(Math.random() * 3) + 6, 10);
    
    // Overall score (weighted average)
    const overallScore = Math.floor((clarity * 0.3) + (confidence * 0.3) + (handling * 0.2) + (vocabulary * 0.2));
    
    return {
      overallScore,
      categories: {
        clarity,
        confidence,
        handling,
        vocabulary
      },
      transcript,
      feedback: "You did a good job addressing pricing concerns. Try emphasizing value over cost in future pitches.",
      strengths: [
        "Good articulation and pacing",
        "Maintained a positive tone throughout"
      ],
      improvements: [
        "Consider addressing ROI more directly",
        "Use more comparative examples to justify pricing"
      ]
    };
  };

  const handleViewScore = () => {
    setDemoState(DemoState.COMPLETE);
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      {demoState === DemoState.INTRO && (
        <div className="text-center space-y-6">
          <h2 className="text-xl font-semibold text-brand-dark">Demo Scenario: Handling Pricing Objections</h2>
          <p className="text-brand-dark/70">
            When you click "Start Demo", you'll have 60 seconds to practice handling pricing objections.
            Speak clearly into your microphone, and we'll transcribe and score your pitch.
          </p>
          <Button 
            onClick={startDemo}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white flex items-center gap-2"
            size="lg"
          >
            <Play size={18} /> Start Demo
          </Button>
        </div>
      )}

      {demoState === DemoState.RECORDING && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-brand-dark">Recording...</h2>
            <div className="flex items-center gap-2 text-brand-blue font-medium">
              <Clock size={20} />
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          <div className="bg-brand-blue/10 rounded-lg p-4">
            <h3 className="font-medium mb-2">Scenario: Pricing Objection</h3>
            <p>"Your solution looks interesting, but honestly, it's priced higher than what we were expecting to pay. We have other options that cost less."</p>
          </div>
          
          <DemoTranscript text={transcript} isRecording={isListening} />
          
          <Button 
            onClick={endDemo}
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            End Demo Early
          </Button>
        </div>
      )}

      {demoState === DemoState.SCORING && scoreData && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-brand-dark">Your Results</h2>
          <DemoScorecard scoreData={scoreData} />
          <Button 
            onClick={handleViewScore}
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            View Full Analysis
          </Button>
        </div>
      )}

      {demoState === DemoState.COMPLETE && scoreData && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-brand-dark">Analysis Complete</h2>
          <p>Sign up for PitchPerfect AI to get detailed feedback and continuous improvement.</p>
        </div>
      )}
    </div>
  );
};

export default DemoSandbox;
