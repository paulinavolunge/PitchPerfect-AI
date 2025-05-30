import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GuestBanner from '@/components/GuestBanner';
import ScenarioSelector from '@/components/roleplay/ScenarioSelector';
import ConversationInterface from '@/components/roleplay/ConversationInterface';
import { Volume2, Volume1, VolumeX, Mic, MessageSquare, Airplay, BookOpen, HelpCircle, UserPlus, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ScriptUpload from '@/components/roleplay/ScriptUpload';
import { useAuth } from "@/context/AuthContext";
import { useGuestMode } from "@/context/GuestModeContext";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from 'react-router-dom';
import PremiumModal from "@/components/PremiumModal";
import GuidedTour from "@/components/GuidedTour";
import GettingStartedModal from "@/components/onboarding/GettingStartedModal";
import QuickStartGuide from "@/components/onboarding/QuickStartGuide";
import { Step } from 'react-joyride';
import { useIsMobile } from '@/hooks/use-mobile';
import LoadingIndicator from '@/components/ui/loading-indicator';
import ReturnToDashboard from '@/components/navigation/ReturnToDashboard';
import { useAutoSave } from '@/hooks/use-auto-save';
import FeedbackPrompt from '@/components/feedback/FeedbackPrompt';
import { trackEvent } from '@/utils/analytics';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const RolePlay = () => {
  const [isScenarioSelected, setIsScenarioSelected] = useState(false);
  const [scenario, setScenario] = useState<{
    difficulty: string;
    objection: string;
    industry: string;
    custom?: string;
  }>({
    difficulty: '',
    objection: '',
    industry: ''
  });
  const [voiceMode, setVoiceMode] = useState<'voice' | 'text' | 'hybrid'>('text');
  const [voiceStyle, setVoiceStyle] = useState<'friendly' | 'assertive' | 'skeptical' | 'rushed'>('friendly');
  const [volume, setVolume] = useState(70);
  const [userScript, setUserScript] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showGettingStartedModal, setShowGettingStartedModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuestUpgradePrompt, setShowGuestUpgradePrompt] = useState(false);
  const [guestPromptShown, setGuestPromptShown] = useState(false);
  const [scriptPreview, setScriptPreview] = useState<string | null>(null);
  const [showScriptConfirm, setShowScriptConfirm] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const { toast } = useToast();
  const { isPremium, user } = useAuth();
  const { isGuestMode } = useGuestMode();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Auto-save functionality (disabled for guest users)
  const { lastSaved, saveData, restoreData, clearSavedData } = useAutoSave({
    key: 'roleplay-session',
    data: {
      scenario,
      voiceMode,
      voiceStyle,
      volume,
      userScript,
      isScenarioSelected
    },
    onRestore: (savedData) => {
      if (savedData && !isGuestMode) {
        setScenario(savedData.scenario);
        setVoiceMode(savedData.voiceMode);
        setVoiceStyle(savedData.voiceStyle);
        setVolume(savedData.volume);
        setUserScript(savedData.userScript);
        setIsScenarioSelected(savedData.isScenarioSelected);
        
        if (savedData.isScenarioSelected) {
          toast({
            title: "Session Restored",
            description: "We've restored your previous session. You can continue where you left off.",
          });
        }
      }
    }
  });

  // Define tour steps
  const tourSteps: Step[] = [
    {
      target: '.scenario-selection',
      content: 'Start by selecting a scenario that matches your needs. Choose difficulty level, objection type, and industry.',
      disableBeacon: true,
      placement: isMobile ? 'bottom' : 'right',
    },
    {
      target: '.script-upload',
      content: 'Or upload your own sales script to practice with.',
      placement: isMobile ? 'top' : 'bottom',
    },
    {
      target: '.voice-style-controls',
      content: 'Customize the AI response style to simulate different types of customers.',
      placement: isMobile ? 'bottom' : 'bottom',
    },
    {
      target: '.interaction-mode-controls',
      content: 'Choose how you want to interact with the AI: text, voice, or both. Toggle between these modes based on your preference.',
      placement: isMobile ? 'bottom' : 'left',
    },
    {
      target: '.conversation-interface',
      content: 'This is where your roleplay happens. Practice handling objections and get real-time responses from the AI.',
      placement: isMobile ? 'top' : 'top',
    },
    {
      target: '.help-button',
      content: 'Need help? You can always access the getting started guide from here.',
      placement: isMobile ? 'top' : 'left',
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleModeChange('text');
            break;
          case '2':
            event.preventDefault();
            handleModeChange('voice');
            break;
          case '3':
            event.preventDefault();
            handleModeChange('hybrid');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Analytics tracking on page load
  useEffect(() => {
    trackEvent('roleplay_page_loaded', {
      isGuest: isGuestMode,
      isPremium: isPremium
    });
  }, [isGuestMode, isPremium]);

  // Check if first time user
  useEffect(() => {
    // Check if guest mode and set default scenario for quick start
    if (isGuestMode && !isScenarioSelected) {
      // Set a default scenario for guest users
      setScenario({
        difficulty: 'Medium',
        objection: 'Price',
        industry: 'SaaS'
      });
      setIsScenarioSelected(true);
      
      // Show a welcome toast
      toast({
        title: "Welcome to Guest Mode",
        description: "You're using PitchPerfect AI as a guest. Your progress won't be saved.",
      });
    }
    // Regular user flow
    else if (user && !isGuestMode) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenRoleplayOnboarding');
      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      
      if (!hasSeenOnboarding && hasCompletedOnboarding) {
        setShowGettingStartedModal(true);
      }
    }
    
    // Check premium status for regular users (not for guests)
    if (!isGuestMode && !isPremium && user) {
      setShowPremiumModal(true);
    }
  }, [isPremium, user, isGuestMode, isScenarioSelected, toast]);

  const handleScenarioSelect = (selectedScenario: typeof scenario) => {
    setScenario(selectedScenario);
    setIsScenarioSelected(true);
    
    // Track scenario selection
    trackEvent('scenario_selected', {
      difficulty: selectedScenario.difficulty,
      objection: selectedScenario.objection,
      industry: selectedScenario.industry,
      isGuest: isGuestMode
    });
    
    // Start roleplay session tracking
    trackEvent('roleplay_started', {
      scenario: selectedScenario,
      isGuest: isGuestMode
    });
    
    // Only save data for non-guest users
    if (!isGuestMode) {
      saveData();
    }
    
    toast({
      title: "Scenario Selected",
      description: `You've chosen a ${selectedScenario.difficulty} ${selectedScenario.industry} scenario with ${selectedScenario.objection} objections.`,
    });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (!isGuestMode) {
      saveData();
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 50) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  const handleVoiceStyleChange = (style: 'friendly' | 'assertive' | 'skeptical' | 'rushed') => {
    setVoiceStyle(style);
    if (!isGuestMode) {
      saveData();
    }
    
    toast({
      title: "Voice Style Changed",
      description: `AI voice style set to ${style}.`,
    });
  };

  const handleScriptSubmit = (script: string) => {
    setScriptPreview(script);
    setShowScriptConfirm(true);
  };

  const confirmScriptUse = () => {
    if (!scriptPreview) return;
    
    setUserScript(scriptPreview);
    setShowScriptConfirm(false);
    setScriptPreview(null);
    
    // Track script upload
    trackEvent('script_uploaded', {
      scriptLength: scriptPreview.length,
      isGuest: isGuestMode
    });
    
    // If user uploaded a script directly, also transition to practice mode
    if (!isScenarioSelected) {
      setIsScenarioSelected(true);
      setScenario({
        difficulty: 'Custom',
        objection: 'Custom',
        industry: 'Custom',
        custom: 'Custom Script'
      });
      
      if (!isGuestMode) {
        saveData();
      }
    }
    
    toast({
      title: "Script Ready",
      description: "Your sales script has been saved. Let's practice!",
    });
  };

  const handleModeChange = (newMode: 'voice' | 'text' | 'hybrid') => {
    // In guest mode, allow all features for demo
    if (!isGuestMode && !isPremium && (newMode === 'voice' || newMode === 'hybrid')) {
      setShowPremiumModal(true);
      return;
    }
    
    setVoiceMode(newMode);
    
    // Track interaction mode change
    trackEvent('interaction_mode_changed', {
      mode: newMode,
      previousMode: voiceMode,
      isGuest: isGuestMode
    });
    
    // Voice mode activation animation and feedback
    if (newMode === 'voice' || newMode === 'hybrid') {
      setVoiceModeActive(true);
      setTimeout(() => setVoiceModeActive(false), 1000);
      
      toast({
        title: "Voice mode active",
        description: "Speak after the tone to interact with the AI.",
        duration: 3000,
      });
    }
    
    if (!isGuestMode) {
      saveData();
    }
    
    toast({
      title: "Mode Changed",
      description: `Interaction mode set to ${newMode}.`,
    });
  };
  
  const handleTourComplete = () => {
    localStorage.setItem('hasSeenRoleplayOnboarding', 'true');
    localStorage.setItem('hasCompletedOnboarding', 'true');
    toast({
      title: "Tour Completed",
      description: "You're all set! Start practicing your sales skills now.",
    });
  };

  const handleStartTour = () => {
    setShowGettingStartedModal(false);
    setShowTour(true);
  };

  const showGettingStartedGuide = () => {
    setShowGettingStartedModal(true);
  };

  const handleSaveSession = () => {
    if (isGuestMode) {
      toast({
        title: "Guest Mode",
        description: "Sessions aren't saved in guest mode. Sign up to save your progress!",
        variant: "destructive",
      });
      return;
    }
    
    saveData();
    toast({
      title: "Session Saved",
      description: "Your progress has been saved.",
    });
  };
  
  const handleProcessingStateChange = (isProcessing: boolean) => {
    setIsProcessing(isProcessing);
  };
  
  const handleFeedbackSubmitted = (wasHelpful: boolean) => {
    console.log('Session feedback:', wasHelpful ? 'helpful' : 'not helpful');
  };

  // Show guest upgrade prompt after first AI interaction
  const handleFirstAIReply = () => {
    if (isGuestMode && !guestPromptShown) {
      setGuestPromptShown(true);
      setTimeout(() => {
        setShowGuestUpgradePrompt(true);
      }, 2000);
    }
  };

  // Calculate trial countdown (demo: 2 days)
  const getTrialCountdown = () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 2);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };
  
  return (
    <>
      <Helmet>
        <title>AI Roleplay Practice | PitchPerfect AI</title>
        <meta name="description" content="Practice your sales pitches with AI-powered roleplay scenarios. Improve your objection handling skills with realistic customer interactions." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        {/* Guest Banner */}
        {isGuestMode && <GuestBanner />}
        
        {/* Guided Tour */}
        <GuidedTour
          steps={tourSteps}
          run={showTour}
          onComplete={handleTourComplete}
          spotlightClicks={true}
        />
        
        {/* Getting Started Modal */}
        <GettingStartedModal
          open={showGettingStartedModal}
          onOpenChange={setShowGettingStartedModal}
          onStartTour={handleStartTour}
        />

        {/* Script Confirmation Modal */}
        {showScriptConfirm && scriptPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Confirm Script Upload</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{scriptPreview}</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowScriptConfirm(false);
                    setScriptPreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={confirmScriptUse}>
                  Confirm & Use Script
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Upgrade Prompt Modal */}
        {showGuestUpgradePrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Enjoying the experience?</h3>
              <p className="text-gray-600 mb-4">
                Sign up to access saved sessions, premium AI features, and your complete practice history.
              </p>
              {getTrialCountdown() > 0 && (
                <p className="text-sm text-amber-600 mb-4 font-medium">
                  ⏰ Free trial offer ends in {getTrialCountdown()} days
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowGuestUpgradePrompt(false)}
                >
                  Continue as Guest
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-[#3A66DB] hover:bg-[#3A66DB]/90"
                >
                  Sign Up Free
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            {!isScenarioSelected ? (
              <div className="space-y-8">
                <div className="flex justify-between items-center mb-4">
                  <ReturnToDashboard />
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={showGettingStartedGuide}
                  >
                    <BookOpen size={16} />
                    Getting Started Guide
                  </Button>
                </div>
              
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-center text-brand-dark">Choose a scenario or upload your script to start practicing</h2>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={showGettingStartedGuide}
                    >
                      <BookOpen size={16} />
                      Getting Started Guide
                    </Button>
                  </div>
                  
                  {/* Quick Start Guide for first-time users */}
                  {!localStorage.getItem('hasSeenRoleplayOnboarding') && (
                    <div className="mt-6">
                      <QuickStartGuide onStartTour={handleStartTour} />
                    </div>
                  )}
                </div>
                
                <div className="scenario-selection">
                  <ScenarioSelector onSelectScenario={handleScenarioSelect} />
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6 script-upload">
                  <h2 className="text-xl font-semibold mb-4 text-brand-dark">Upload Your Script</h2>
                  <ScriptUpload onScriptSubmit={handleScriptSubmit} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <ReturnToDashboard />
                    <h1 className="text-2xl font-bold text-brand-dark">Role Play Practice</h1>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 voice-style-controls">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleVoiceStyleChange('friendly')}
                        className={voiceStyle === 'friendly' ? "bg-brand-blue/20 text-brand-dark" : ""}
                      >
                        Friendly
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleVoiceStyleChange('assertive')}
                        className={voiceStyle === 'assertive' ? "bg-brand-blue/20 text-brand-dark" : ""}
                      >
                        Assertive
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleVoiceStyleChange('skeptical')}
                        className={voiceStyle === 'skeptical' ? "bg-brand-blue/20 text-brand-dark" : ""}
                      >
                        Skeptical
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleVoiceStyleChange('rushed')}
                        className={voiceStyle === 'rushed' ? "bg-brand-blue/20 text-brand-dark" : ""}
                      >
                        Rushed
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVolumeIcon()}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        aria-label="Adjust volume"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <div className="mb-3 flex justify-between items-center">
                    <div>
                      <span className="inline-block bg-brand-blue/30 text-xs font-medium rounded-full px-2.5 py-1 mr-2">
                        {scenario.difficulty}
                      </span>
                      <span className="inline-block bg-brand-blue/30 text-xs font-medium rounded-full px-2.5 py-1 mr-2">
                        {scenario.industry}
                      </span>
                      <span className="inline-block bg-brand-blue/30 text-xs font-medium rounded-full px-2.5 py-1">
                        {scenario.objection}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 interaction-mode-controls">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Toggle 
                            pressed={voiceMode === 'voice'} 
                            onClick={() => handleModeChange('voice')}
                            aria-label="Voice only mode"
                            aria-pressed={voiceMode === 'voice'}
                            className="data-[state=on]:bg-brand-blue data-[state=on]:text-white group"
                            disabled={!isPremium && !isGuestMode}
                          >
                            <motion.div
                              animate={voiceModeActive && voiceMode === 'voice' ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <Mic size={18} />
                            </motion.div>
                          </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Voice only (Ctrl+2)</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Toggle 
                            pressed={voiceMode === 'text'} 
                            onClick={() => handleModeChange('text')}
                            aria-label="Text only mode"
                            aria-pressed={voiceMode === 'text'}
                            className="data-[state=on]:bg-brand-blue data-[state=on]:text-white group"
                          >
                            <MessageSquare size={18} />
                          </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Text only (Ctrl+1)</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Toggle 
                            pressed={voiceMode === 'hybrid'} 
                            onClick={() => handleModeChange('hybrid')}
                            aria-label="Voice and text mode"
                            aria-pressed={voiceMode === 'hybrid'}
                            className="data-[state=on]:bg-brand-blue data-[state=on]:text-white group"
                            disabled={!isPremium && !isGuestMode}
                          >
                            <motion.div
                              animate={voiceModeActive && voiceMode === 'hybrid' ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              <Airplay size={18} />
                            </motion.div>
                          </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Voice and text (Ctrl+3)</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleSaveSession}
                            className="h-8 w-8 group"
                            aria-label="Save session"
                          >
                            <Save size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save Session</TooltipContent>
                      </Tooltip>
                      
                      <div className="ml-2 help-button">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={showGettingStartedGuide}
                              className="h-8 w-8 group"
                              aria-label="Getting started guide"
                            >
                              <HelpCircle size={18} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Getting Started Guide</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  
                  <div className="conversation-interface">
                    {isProcessing && (
                      <div aria-live="polite">
                        <LoadingIndicator className="my-4" />
                      </div>
                    )}
                    
                    <ConversationInterface 
                      mode={voiceMode} 
                      scenario={scenario} 
                      voiceStyle={voiceStyle}
                      volume={volume}
                      userScript={userScript}
                      onProcessingStateChange={handleProcessingStateChange}
                      onFirstAIReply={handleFirstAIReply}
                    />
                  </div>
                </div>
                
                {userScript && (
                  <div className="mt-4 p-4 bg-brand-blue/10 rounded-lg">
                    <p className="text-sm text-brand-dark/70">
                      Practicing with your uploaded script. The AI will respond based on your script content.
                    </p>
                  </div>
                )}
                
                {/* Feedback prompt */}
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-300 rounded-lg">
                  <FeedbackPrompt 
                    feedbackType="roleplay"
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                  />
                </div>
                
                {/* Last save information */}
                {lastSaved && !isGuestMode && (
                  <div 
                    className="mt-2 text-xs text-brand-dark/50 text-right"
                    aria-live="polite"
                  >
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
                
                {isGuestMode && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-brand-blue/10 p-6 rounded-lg text-center"
                  >
                    <h3 className="text-lg font-medium mb-2 text-brand-dark">Enjoying the experience?</h3>
                    <p className="text-brand-dark/70 mb-2">
                      Sign up to access saved sessions, premium AI features, and your complete practice history.
                    </p>
                    {getTrialCountdown() > 0 && (
                      <p className="text-sm text-amber-600 mb-4 font-medium">
                        ⏰ Free trial offer ends in {getTrialCountdown()} days
                      </p>
                    )}
                    <div className="flex justify-center gap-3">
                      <Button 
                        variant="default" 
                        onClick={() => {
                          navigate('/signup');
                        }}
                        className="bg-[#3A66DB] hover:bg-[#3A66DB]/90 text-white font-medium px-6 py-3 rounded-md shadow-sm hover:shadow-md transition-all scale-105 group"
                        size="lg"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up Free
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          navigate('/pricing');
                        }}
                        size="lg"
                        className="group"
                      >
                        View Plans
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </main>
        
        <Footer />
        
        {/* Premium Modal - only show for registered users, not for guests */}
        {!isGuestMode && (
          <PremiumModal 
            isOpen={showPremiumModal} 
            onClose={() => {
              setShowPremiumModal(false);
              if (!isPremium && user) {
                navigate("/subscription");
              }
            }}
            feature="AI roleplay practice"
          />
        )}
      </div>
    </>
  );
};

export default RolePlay;
