
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoSandbox from '@/components/demo/DemoSandbox';
import PracticeObjection from '@/components/demo/PracticeObjection';
import WaitlistModal from '@/components/demo/WaitlistModal';
import GuestBanner from '@/components/GuestBanner';
import WebhookSettings from '@/components/WebhookSettings';
import { sendSessionToCRM, CRMProvider } from '@/utils/webhookUtils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus, RefreshCw, Sparkles } from 'lucide-react';
import MicrophoneGuard from '@/components/MicrophoneGuard';
import AIDisclosure from '@/components/AIDisclosure';
import { useGuestMode } from '@/context/GuestModeContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DemoNavigation from '@/components/demo/DemoNavigation';
import { whisperTranscribe } from '@/lib/whisper-api';

const Demo = () => {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [crmProvider, setCrmProvider] = useState<CRMProvider>("zapier");
  const [objectionScenario, setObjectionScenario] = useState("Your solution looks interesting, but honestly, it's priced higher than what we were expecting to pay. We have other options that cost less.");
  const [hasError, setHasError] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { isGuestMode } = useGuestMode();
  const { user, deductUserCredits } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Component mounted
  }, []);
  
  const handleDemoComplete = (data?: any) => {
    // Save session data
    if (data) {
      setSessionData(data);
    }
    
    // Only show the waitlist modal for non-guest users
    if (!isGuestMode) {
      setShowWaitlistModal(true);
    }
    
    // Then send the data to CRM via webhook
    if (data) {
      sendSessionToCRM(data, crmProvider)
        .then(webhookResult => {
          // Show appropriate toast
          if (webhookResult.success) {
            toast({
              title: "Session Recorded",
              description: webhookResult.message,
              variant: "default",
            });
          } else {
            // No toast for failure in production to avoid confusing users
          }
        });
    }
  };

  const handleObjectionSubmit = async (input: { type: 'voice' | 'text'; data: Blob | string }) => {
    try {
      setHasError(false);
      
      // Show immediate feedback that we're processing
      toast({
        title: "Processing Response",
        description: `Analyzing your ${input.type} response...`,
        duration: 3000,
      });
      
      // For demo purposes, we'll deduct credits if user is authenticated
      if (!isGuestMode && user) {
        const creditsToDeduct = input.type === 'text' ? 1 : 2; // Voice costs more
        const featureType = `demo_objection_${input.type}`;
        
        const deducted = await deductUserCredits(featureType, creditsToDeduct);
        if (!deducted) {
          // The deductUserCredits function already shows appropriate toast
          return;
        }
      }
      
      let responseText = '';
      
      // Process voice input
      if (input.type === 'voice' && input.data instanceof Blob) {
        try {
          toast({
            title: "Transcribing Audio",
            description: "Converting your speech to text...",
          });
          
          responseText = await whisperTranscribe(input.data);
          
          if (!responseText || responseText.trim().length === 0) {
            throw new Error('No speech detected in audio');
          }
        } catch (transcriptionError) {
          console.error('Transcription error:', transcriptionError);
          toast({
            title: "Transcription Failed",
            description: "Could not transcribe your audio. Please try again.",
            variant: "destructive",
          });
          setHasError(true);
          return;
        }
      } else {
        responseText = typeof input.data === 'string' ? input.data : '';
      }
      
      // Generate AI feedback
      const feedbackData = {
        type: input.type,
        response: responseText,
        timestamp: new Date().toISOString(),
        feedback: generateEnhancedFeedback(responseText),
        score: Math.floor(Math.random() * 3) + 7 // Mock score 7-10
      };
      
      setFeedback(feedbackData.feedback);
      
      // Complete the demo with the feedback data
      handleDemoComplete(feedbackData);
      
      // Show completion toast
      toast({
        title: "Analysis Complete",
        description: `Your ${input.type} response has been analyzed and feedback is ready.`,
        variant: "default",
        duration: 4000,
      });
      
    } catch (error) {
      console.error('Error processing objection:', error);
      setHasError(true);
      toast({
        title: "Processing Error",
        description: "There was an issue analyzing your response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateEnhancedFeedback = (response: string): string => {
    // Enhanced feedback generation with more detailed analysis
    const lowerResponse = response.toLowerCase();
    const responseLength = response.length;
    
    // Check for key elements
    const hasValue = lowerResponse.includes('value') || lowerResponse.includes('roi') || lowerResponse.includes('benefit');
    const hasEmpathy = lowerResponse.includes('understand') || lowerResponse.includes('appreciate') || lowerResponse.includes('hear');
    const hasSpecifics = lowerResponse.includes('example') || lowerResponse.includes('specifically') || lowerResponse.includes('case');
    const hasQuestions = response.includes('?');
    const hasComparison = lowerResponse.includes('compare') || lowerResponse.includes('competition') || lowerResponse.includes('alternative');
    
    let feedback = "**AI Analysis of Your Response:**\n\n";
    
    // Tone and Empathy
    if (hasEmpathy) {
      feedback += "✅ **Tone & Empathy**: Excellent! You acknowledged their concern, which builds rapport and trust.\n\n";
    } else {
      feedback += "💡 **Tone & Empathy**: Consider starting with acknowledgment like 'I understand your budget concerns' to build rapport.\n\n";
    }
    
    // Value Focus
    if (hasValue) {
      feedback += "✅ **Value Focus**: Great job emphasizing value and ROI! This effectively addresses pricing objections.\n\n";
    } else {
      feedback += "💡 **Value Focus**: Try highlighting specific ROI or value propositions to justify the investment.\n\n";
    }
    
    // Specificity
    if (hasSpecifics) {
      feedback += "✅ **Specificity**: Well done using specific examples! This builds credibility.\n\n";
    } else {
      feedback += "💡 **Specificity**: Add concrete examples or case studies to strengthen your argument.\n\n";
    }
    
    // Discovery
    if (hasQuestions) {
      feedback += "✅ **Discovery**: Good use of questions to understand their needs better!\n\n";
    } else {
      feedback += "💡 **Discovery**: Consider asking questions to uncover the real concern behind the objection.\n\n";
    }
    
    // Response Quality
    if (responseLength > 100) {
      feedback += "✅ **Detail Level**: Comprehensive response with good detail.\n\n";
    } else if (responseLength > 50) {
      feedback += "⚠️ **Detail Level**: Adequate response, but could be more thorough.\n\n";
    } else {
      feedback += "💡 **Detail Level**: Your response is quite brief. Provide more detail to be convincing.\n\n";
    }
    
    // Overall recommendation
    feedback += "**Next Steps**: ";
    if (hasValue && hasEmpathy && hasSpecifics) {
      feedback += "Excellent objection handling! Continue practicing with more complex scenarios.";
    } else if (hasValue || hasEmpathy) {
      feedback += "Good foundation! Focus on combining empathy with specific value propositions.";
    } else {
      feedback += "Keep practicing! Remember to acknowledge concerns, then pivot to value and specific benefits.";
    }
    
    return feedback;
  };

  const handleTryMoreFeatures = () => {
    navigate('/roleplay');
  };

  const handleRetry = () => {
    setHasError(false);
    setFeedback(null);
    setSessionData(null);
  };
  
  return (
    <>
      <Helmet>
        <title>Try PitchPerfect AI Demo | Free Sales Practice Session</title>
        <meta name="description" content="Experience PitchPerfect AI with our free interactive demo. Practice handling sales objections and get instant AI-powered feedback on your pitch delivery." />
        <meta name="keywords" content="sales demo, AI pitch practice, free trial, objection handling, sales training demo" />
        <meta property="og:title" content="Free PitchPerfect AI Demo - Try AI Sales Training" />
        <meta property="og:description" content="Test drive our AI-powered sales training platform. Practice objection handling and get instant feedback." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/demo`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <DemoNavigation 
          currentStep={1}
          totalSteps={3}
          showProgress={true}
          onHelp={() => {/* Help handler */}}
        />
        {isGuestMode && <GuestBanner />}
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <AIDisclosure 
                title="AI-Powered Demo"
                description="This demo features AI-generated feedback based on your speech. The analysis and suggestions are created by artificial intelligence and should be considered illustrative."
                className="mb-6"
              />
              
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-brand-dark">Try PitchPerfect AI - Objection Handling Practice</h1>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowWebhookSettings(true)}
                    className="flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    <span>CRM Settings</span>
                  </Button>
                </div>
                <p className="text-brand-dark/80 mb-6">
                  Experience how PitchPerfect AI helps you improve your sales pitch. 
                  Practice handling pricing objections using either voice or text input, and get instant feedback.
                </p>
                
                {hasError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                      <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
                      <p className="text-red-600 mb-4">We encountered an issue processing your response. This could be a temporary problem.</p>
                      <Button onClick={handleRetry} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MicrophoneGuard>
                    <PracticeObjection
                      scenario={objectionScenario}
                      onSubmit={handleObjectionSubmit}
                    />
                  </MicrophoneGuard>
                )}

                {feedback && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg shadow-sm">
                    <h3 className="font-bold text-green-800 mb-4 text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      AI Feedback Analysis
                    </h3>
                    <div className="text-green-700 space-y-2 whitespace-pre-wrap">
                      {feedback.split('\n').map((line, index) => {
                        // Handle markdown-style formatting
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <p key={index} className="font-bold text-green-800 mt-3">
                              {line.replace(/\*\*/g, '')}
                            </p>
                          );
                        } else if (line.includes('✅')) {
                          return (
                            <p key={index} className="text-green-700 ml-2">
                              {line}
                            </p>
                          );
                        } else if (line.includes('💡')) {
                          return (
                            <p key={index} className="text-amber-700 ml-2">
                              {line}
                            </p>
                          );
                        } else if (line.includes('⚠️')) {
                          return (
                            <p key={index} className="text-orange-700 ml-2">
                              {line}
                            </p>
                          );
                        } else if (line.trim() === '') {
                          return <br key={index} />;
                        } else {
                          return (
                            <p key={index} className="text-gray-700">
                              {line}
                            </p>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {isGuestMode && sessionData && (
                <div className="bg-brand-blue/10 rounded-lg p-6 text-center mb-8">
                  <h3 className="text-xl font-medium mb-2 text-brand-dark">Want to try more features?</h3>
                  <p className="text-brand-dark/70 mb-4">
                    You're using PitchPerfect AI in guest mode. Try our role-playing feature or sign up to save your progress.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button 
                      onClick={handleTryMoreFeatures}
                      className="bg-brand-blue hover:bg-brand-blue/90"
                    >
                      Try Role-Playing
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/signup')}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up Free
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />

        <WaitlistModal 
          open={showWaitlistModal} 
          onOpenChange={setShowWaitlistModal}
          sessionData={sessionData}
        />
        
        <WebhookSettings
          open={showWebhookSettings}
          onOpenChange={setShowWebhookSettings}
        />
      </div>
    </>
  );
};

export default Demo;
