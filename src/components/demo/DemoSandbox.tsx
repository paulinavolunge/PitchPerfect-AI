import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Clock, RefreshCw, UserPlus } from 'lucide-react'; // Added UserPlus for signup CTA
import DemoTranscript from './DemoTranscript';
import DemoScorecard from './DemoScorecard';
import { useToast } from '@/hooks/use-toast';
import { getSampleScenario } from '@/utils/demoUtils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { trackDemoActivation, checkTranscriptionConfidence } from '@/utils/analyticsUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AudioWaveform from '@/components/animations/AudioWaveform';
import ConfettiEffect from '@/components/animations/ConfettiEffect';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { useGuestMode } from '@/context/GuestModeContext'; // Import useGuestMode
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import PremiumModal from '@/components/PremiumModal'; // Import PremiumModal

// Import the speech recognition types from the global window augmentations
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
}

interface DemoSandboxProps {
  onComplete?: (sessionData?: any) => void;
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
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { toast } = useToast();
  const { user, creditsRemaining, trialUsed, startFreeTrial, deductUserCredits } = useAuth();
  const { isGuestMode } = useGuestMode();
  const navigate = useNavigate();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sandboxRef = useRef<HTMLDivElement>(null);

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
          // Get confidence from results
          const confidence = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.confidence)
            .reduce((acc, val) => acc + val, 0) / event.results.length;

          // Check if confidence is low
          if (checkTranscriptionConfidence(confidence)) {
            setLowConfidence(true);
          } else {
            setLowConfidence(false);
          }

          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

          setTranscript(transcript);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            setPermissionDenied(true);
          }
          toast({
            title: "Voice recognition error",
            description: `Error: ${event.error}. Please allow microphone access.`,
            variant: "destructive",
          });
        };
      }
    }

    // Set up event listener for button-triggered demo start
    const handleAutoDemoStart = () => {
      if (demoState === DemoState.INTRO) {
        // Note: Auto-start will now go through the credit check logic too
        startDemo('auto');
      }
    };

    window.addEventListener('start-demo-auto', handleAutoDemoStart);

    // Cleanup
    return () => {
      window.removeEventListener('start-demo-auto', handleAutoDemoStart);
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
  }, [toast, demoState, isListening]);

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

  // Setup Intersection Observer for auto-starting the demo when scrolled into view
  useEffect(() => {
    // Only setup the observer if we're in the INTRO state
    if (demoState !== DemoState.INTRO || !sandboxRef.current) return;

    const options = {
      root: null, // use viewport as root
      rootMargin: '0px',
      threshold: 0.7, // 70% of the element needs to be visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // If the sandbox is visible and we haven't started the demo yet
        if (entry.isIntersecting && demoState === DemoState.INTRO) {
          // Small delay to ensure user has time to register what they're seeing
          setTimeout(() => {
            if (demoState === DemoState.INTRO) {
              startDemo('scroll');
            }
          }, 1500);
        }
      });
    }, options);

    if (sandboxRef.current) {
      observer.observe(sandboxRef.current);
    }

    return () => {
      if (sandboxRef.current) {
        observer.unobserve(sandboxRef.current);
      }
    };
  }, [demoState, user, creditsRemaining, trialUsed]);

  const startDemo = async (activationType: 'auto' | 'button' | 'scroll' = 'button') => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice recognition not supported",
        description: "Your browser does not support voice recognition. Please try a different browser.",
        variant: "destructive",
      });
      return;
    }

    // --- Credit System Logic ---
    if (!isGuestMode) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in or sign up to try PitchPerfect AI. New users get 1 Free Pitch Analysis!",
          variant: "destructive",
        });
        return;
      }

      if (!trialUsed) {
        if (creditsRemaining < 1) {
          try {
            const startedTrial = await startFreeTrial();
            if (!startedTrial) {
              toast({
                title: "Action required",
                description: "Could not start free analysis. Please contact support.",
                variant: "destructive"
              });
              return;
            }
          } catch (error) {
            toast({
              title: "Error starting trial",
              description: "Could not start free analysis. Please try again.",
              variant: "destructive"
            });
            return;
          }
        }
      } else if (creditsRemaining <= 0) {
        setShowPremiumModal(true);
        return;
      }

      try {
        const deducted = await deductUserCredits('demo_pitch_analysis', 1);
        if (!deducted) {
          return;
        }
      } catch (error) {
        toast({
          title: "Error processing request",
          description: "Could not process your request. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }
    // --- End Credit System Logic ---

    trackDemoActivation(activationType);

    try {
      setPermissionDenied(false);
      setLowConfidence(false);
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
        description: "Could not start voice recognition. Please allow microphone access and try again.",
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

  const retryMicrophoneAccess = () => {
    setPermissionDenied(false);
    startDemo('button');
  };

  const handleSlowSpeechRetry = () => {
    setLowConfidence(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
          toast({
            title: "Recording restarted",
            description: "Try speaking a bit slower and more clearly.",
          });
        }
      }, 500);
    }
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

    // Trigger confetti if score is good
    if (scoreData.overallScore >= 7) {
      setShowConfetti(true);
    }

    setTimeout(() => {
      onComplete?.({
        ...scoreData,
        timestamp: new Date().toISOString()
      });
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `<span class="math-inline">\{mins\}\:</span>{secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6" ref={sandboxRef}>
      <ConfettiEffect active={showConfetti} duration={3000} onComplete={() => setShowConfetti(false)} />

      {/* Alerts */}
      <AnimatePresence>
        {permissionDenied && demoState === DemoState.RECORDING && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive" className="mb-4 border-red-500 bg-red-50">
              <AlertTitle>Microphone access denied</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>We can't hear you. Please allow microphone access.</span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={retryMicrophoneAccess}
                  className="flex items-center gap-1 hover:scale-105 transition-transform"
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {lowConfidence && demoState === DemoState.RECORDING && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="mb-4 border-amber-500 bg-amber-50">
              <AlertTitle>Speech detection issue</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>It's a bit fast—could you speak a little slower?</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSlowSpeechRetry}
                  className="flex items-center gap-1 hover:scale-105 transition-transform"
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {demoState === DemoState.INTRO && (
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-brand-dark">Demo Scenario: Handling Pricing Objections</h2>
          <p className="text-brand-dark/70">
            When you click "Start Demo", you'll have 60 seconds to practice handling pricing objections.
            Speak clearly into your microphone, and we'll transcribe and score your pitch.
          </p>

          <Button 
            onClick={() => startDemo('button')}
            className="bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white flex items-center gap-2 hover:scale-105 transition-transform shadow-md hover:shadow-lg"
            size="lg"
          >
            <Play size={18} /> Start Demo
          </Button>
          {!user && (
              <Button
                variant="outline"
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 mt-4 ml-2"
              >
                <UserPlus className="h-4 w-4" /> Sign Up for Free
              </Button>
            )}
        </motion.div>
      )}

      {demoState === DemoState.RECORDING && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-brand-dark">Recording...</h2>
            <motion.div 
              className="flex items-center gap-2 text-brand-blue font-medium"
              animate={{ scale: timeRemaining <= 10 ? [1, 1.05, 1] : 1 }}
              transition={{ repeat: timeRemaining <= 10 ? Infinity : 0, duration: 0.5 }}
            >
              <Clock size={20} />
              {formatTime(timeRemaining)}
            </motion.div>
          </div>

          <motion.div 
            className="bg-gradient-to-br from-brand-blue/10 to-[#008D95]/10 rounded-lg p-4"
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-medium mb-2">Scenario: Pricing Objection</h3>
            <p>"Your solution looks interesting, but honestly, it's priced higher than what we were expecting to pay. We have other options that cost less."</p>
          </motion.div>

          {/* Voice waveform visualization */}
          <div className="py-4">
            <AudioWaveform isActive={isListening} isUser={true} color="#008D95" className="mb-2" />
          </div>

          <DemoTranscript text={transcript} isRecording={isListening} />

          <Button 
            onClick={endDemo}
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white hover:scale-105 transition-transform"
          >
            End Demo Early
          </Button>
        </motion.div>
      )}

      {demoState === DemoState.SCORING && scoreData && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-brand-dark">Your Results</h2>
          <DemoScorecard scoreData={scoreData} />

          <Button 
            onClick={handleViewScore}
            className="w-full bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white hover:scale-105 transition-transform shadow-md hover:shadow-lg"
          >
            View Full Analysis
          </Button>
        </motion.div>
      )}

      {demoState === DemoState.COMPLETE && scoreData && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-brand-dark">Analysis Complete</h2>
          <p>Sign up for PitchPerfect AI to get detailed feedback and continuous improvement.</p>
        </motion.div>
      )}

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        feature="1 free pitch analysis"
      />
    </div>
  );
};

export default DemoSandbox;
