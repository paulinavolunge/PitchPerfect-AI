import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Volume2, 
  Star,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const InteractiveDemo: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const scenarios = [
    {
      title: "Handling Price Objections",
      objection: "Your solution looks great, but it's too expensive compared to competitors.",
      tips: "Focus on value, ROI, and unique differentiators"
    },
    {
      title: "Timing Concerns", 
      objection: "This isn't the right time for us to make this kind of investment.",
      tips: "Address urgency and opportunity cost"
    },
    {
      title: "Authority Questions",
      objection: "I need to discuss this with my team before making any decisions.",
      tips: "Identify decision makers and create urgency"
    }
  ];

  const mockFeedback = {
    score: 8.5,
    strengths: [
      "Strong confidence in delivery",
      "Good use of specific metrics",
      "Addressed the core concern directly"
    ],
    improvements: [
      "Could elaborate more on ROI benefits", 
      "Consider using a softer tone for objection handling",
      "Add a compelling call-to-action"
    ],
    recommendation: "Excellent foundation! Focus on quantifying the value proposition with specific examples."
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Practice your response to the objection above",
      });

      // Auto-stop after 30 seconds for demo
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          handleStopRecording();
        }
      }, 30000);

    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to try the voice demo",
        variant: "destructive"
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setHasRecorded(true);
    
    // Simulate AI processing
    toast({
      title: "Processing Your Response",
      description: "Our AI is analyzing your pitch...",
    });

    setTimeout(() => {
      setShowFeedback(true);
      toast({
        title: "Analysis Complete!",
        description: "Your personalized feedback is ready",
        variant: "default"
      });
    }, 2000);
  };

  const handleTryFullDemo = () => {
    navigate('/demo');
  };

  const nextScenario = () => {
    setCurrentStep((prev) => (prev + 1) % scenarios.length);
    setIsRecording(false);
    setHasRecorded(false);
    setShowFeedback(false);
  };

  const currentScenario = scenarios[currentStep];

  return (
    <section className="py-16 bg-white" aria-labelledby="interactive-demo-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-200" aria-label="Interactive feature">
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Interactive Demo
          </Badge>
          <h2 id="interactive-demo-heading" className="text-3xl md:text-4xl font-bold text-deep-navy mb-4">
            Try PitchPerfect AI Right Now
          </h2>
          <p className="text-deep-navy/70 max-w-2xl mx-auto text-lg">
            Experience our AI-powered feedback system. Practice handling a real sales objection and get instant analysis.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scenario Card */}
            <Card className="border-2 border-primary-100 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-deep-navy">
                    {currentScenario.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-primary-600 border-primary-200">
                    Scenario {currentStep + 1}/3
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-800 mb-2" id="objection-heading">
                    Customer Objection:
                  </h3>
                  <p className="text-amber-700 italic" aria-labelledby="objection-heading">
                    "{currentScenario.objection}"
                  </p>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary-800 mb-2">
                    💡 Pro Tip:
                  </h3>
                  <p className="text-primary-700">
                    {currentScenario.tips}
                  </p>
                </div>

                <div className="text-center space-y-4">
                  {!hasRecorded ? (
                    <Button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`w-full text-lg font-semibold ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                          : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                      aria-label={isRecording ? 'Stop recording your response' : 'Start recording your response'}
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-5 w-5 mr-2" aria-hidden="true" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5 mr-2" aria-hidden="true" />
                          Start Recording Your Response
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <CheckCircle2 className="h-12 w-12 text-primary-600 mx-auto" aria-hidden="true" />
                      <p className="text-primary-700 font-medium">Recording Complete!</p>
                      <Button
                        onClick={nextScenario}
                        variant="outline"
                        className="w-full"
                        aria-label="Try the next scenario"
                      >
                        Try Next Scenario
                        <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                      </Button>
                    </div>
                  )}

                  {isRecording && (
                    <div className="flex items-center justify-center text-red-600" role="status" aria-live="polite">
                      <div className="animate-pulse flex items-center">
                        <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm">Recording in progress...</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback Card */}
            <Card className="border-2 border-vibrant-blue-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-deep-navy flex items-center">
                  <Star className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" />
                  AI Feedback Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showFeedback ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Volume2 className="h-16 w-16 mx-auto mb-4 opacity-30" aria-hidden="true" />
                    <p>Record your response to see AI-powered feedback</p>
                  </div>
                ) : (
                  <div className="space-y-6" role="region" aria-label="AI feedback results">
                    {/* Score */}
                    <div className="text-center bg-primary-50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-primary-600 mb-1">
                        {mockFeedback.score}/10
                      </div>
                      <p className="text-primary-700 font-medium">Overall Score</p>
                    </div>

                    {/* Strengths */}
                    <div>
                      <h3 className="font-semibold text-primary-800 mb-3 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" aria-hidden="true" />
                        Strengths
                      </h3>
                      <ul className="space-y-2" role="list">
                        {mockFeedback.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvements */}
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-3">
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-2" role="list">
                        {mockFeedback.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <div className="h-4 w-4 border-2 border-amber-400 rounded-full mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendation */}
                    <div className="bg-vibrant-blue-50 border border-vibrant-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-vibrant-blue-800 mb-2">
                        AI Recommendation
                      </h3>
                      <p className="text-vibrant-blue-700 text-sm">
                        {mockFeedback.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <p className="text-deep-navy/70 mb-6 text-lg">
              Ready to experience the full platform?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleTryFullDemo}
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-lg font-semibold"
              >
                Try Full Demo
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                variant="outline"
                size="lg"
                className="text-lg border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;