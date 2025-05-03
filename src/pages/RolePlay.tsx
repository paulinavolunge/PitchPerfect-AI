
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScenarioSelector from '@/components/roleplay/ScenarioSelector';
import ConversationInterface from '@/components/roleplay/ConversationInterface';
import { Volume2, Volume1, VolumeX, Mic, MessageSquare, Airplay, BookOpen, HelpCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ScriptUpload from '@/components/roleplay/ScriptUpload';
import { useAuth } from "@/context/AuthContext";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from 'react-router-dom';
import PremiumModal from "@/components/PremiumModal";
import GuidedTour from "@/components/GuidedTour";
import GettingStartedModal from "@/components/onboarding/GettingStartedModal";
import { Step } from 'react-joyride';

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
  const { toast } = useToast();
  const { isPremium, user } = useAuth();
  const navigate = useNavigate();

  // Define tour steps
  const tourSteps: Step[] = [
    {
      target: '.scenario-selection',
      content: 'Start by selecting a scenario that matches your needs. Choose difficulty level, objection type, and industry.',
      disableBeacon: true,
      placement: 'bottom' as const,
    },
    {
      target: '.script-upload',
      content: 'Or upload your own sales script to practice with.',
      placement: 'top' as const,
    },
    {
      target: '.voice-style-controls',
      content: 'Customize the AI response style to simulate different types of customers.',
      placement: 'bottom' as const,
    },
    {
      target: '.interaction-mode-controls',
      content: 'Choose how you want to interact with the AI: text, voice, or both (premium features).',
      placement: 'left' as const,
    },
    {
      target: '.conversation-interface',
      content: 'This is where your roleplay happens. Practice handling objections and get real-time responses from the AI.',
      placement: 'top' as const,
    },
    {
      target: '.help-button',
      content: 'Need help? You can always access the getting started guide from here.',
      placement: 'left' as const,
    }
  ];

  // Check if first time user
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenRoleplayOnboarding');
    if (user && !hasSeenOnboarding) {
      setShowGettingStartedModal(true);
    }
    
    // Check if premium, if not show premium modal
    if (!isPremium) {
      setShowPremiumModal(true);
    }
  }, [isPremium, user]);

  const handleScenarioSelect = (selectedScenario: typeof scenario) => {
    setScenario(selectedScenario);
    setIsScenarioSelected(true);
    toast({
      title: "Scenario Selected",
      description: `You've chosen a ${selectedScenario.difficulty} ${selectedScenario.industry} scenario with ${selectedScenario.objection} objections.`,
    });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 50) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  const handleVoiceStyleChange = (style: 'friendly' | 'assertive' | 'skeptical' | 'rushed') => {
    setVoiceStyle(style);
    toast({
      title: "Voice Style Changed",
      description: `AI voice style set to ${style}.`,
    });
  };

  const handleScriptSubmit = (script: string) => {
    setUserScript(script);
    // If user uploaded a script directly, also transition to practice mode
    if (!isScenarioSelected) {
      setIsScenarioSelected(true);
      setScenario({
        difficulty: 'Custom',
        objection: 'Custom',
        industry: 'Custom',
        custom: 'Custom Script'
      });
    }
    toast({
      title: "Script Ready",
      description: "Your sales script has been saved. Let's practice!",
    });
  };

  const handleModeChange = (newMode: 'voice' | 'text' | 'hybrid') => {
    if (!isPremium && (newMode === 'voice' || newMode === 'hybrid')) {
      setShowPremiumModal(true);
      return;
    }
    
    setVoiceMode(newMode);
    toast({
      title: "Mode Changed",
      description: `Interaction mode set to ${newMode}.`,
    });
  };
  
  const handleTourComplete = () => {
    localStorage.setItem('hasSeenRoleplayOnboarding', 'true');
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        run={showTour}
        onComplete={handleTourComplete}
      />
      
      {/* Getting Started Modal */}
      <GettingStartedModal
        open={showGettingStartedModal}
        onOpenChange={setShowGettingStartedModal}
        onStartTour={handleStartTour}
      />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          {!isScenarioSelected ? (
            <div className="space-y-8">
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
                <h1 className="text-2xl font-bold text-brand-dark">Role Play Practice</h1>
                
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
                          aria-label="Voice mode"
                          className="data-[state=on]:bg-brand-blue data-[state=on]:text-white"
                          disabled={!isPremium}
                        >
                          <Mic size={18} />
                        </Toggle>
                      </TooltipTrigger>
                      <TooltipContent>Voice only</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Toggle 
                          pressed={voiceMode === 'text'} 
                          onClick={() => handleModeChange('text')}
                          aria-label="Text mode"
                          className="data-[state=on]:bg-brand-blue data-[state=on]:text-white"
                        >
                          <MessageSquare size={18} />
                        </Toggle>
                      </TooltipTrigger>
                      <TooltipContent>Text only</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Toggle 
                          pressed={voiceMode === 'hybrid'} 
                          onClick={() => handleModeChange('hybrid')}
                          aria-label="Hybrid mode"
                          className="data-[state=on]:bg-brand-blue data-[state=on]:text-white"
                          disabled={!isPremium}
                        >
                          <Airplay size={18} />
                        </Toggle>
                      </TooltipTrigger>
                      <TooltipContent>Voice and text</TooltipContent>
                    </Tooltip>
                    
                    <div className="ml-2 help-button">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={showGettingStartedGuide}
                            className="h-8 w-8"
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
                  <ConversationInterface 
                    mode={voiceMode} 
                    scenario={scenario} 
                    voiceStyle={voiceStyle}
                    volume={volume}
                    userScript={userScript}
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
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Premium Modal */}
      <PremiumModal 
        open={showPremiumModal} 
        onOpenChange={(isOpen) => {
          setShowPremiumModal(isOpen);
          if (!isOpen && !isPremium) {
            // Redirect to subscription page if they close the modal but aren't premium
            navigate("/subscription");
          }
        }}
        featureName="AI roleplay practice"
      />
    </div>
  );
};

export default RolePlay;
