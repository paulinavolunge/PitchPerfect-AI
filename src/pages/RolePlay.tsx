
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScenarioSelector from '@/components/roleplay/ScenarioSelector';
import ConversationInterface from '@/components/roleplay/ConversationInterface';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ScriptUpload from '@/components/roleplay/ScriptUpload';
import { useAuth } from "@/context/AuthContext";

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
  const [voiceMode, setVoiceMode] = useState<'voice' | 'text' | 'hybrid'>('hybrid');
  const [voiceStyle, setVoiceStyle] = useState<'friendly' | 'assertive' | 'skeptical' | 'rushed'>('friendly');
  const [volume, setVolume] = useState(70);
  const [userScript, setUserScript] = useState<string | null>(null);
  const { toast } = useToast();
  const { isPremium } = useAuth();

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

  // This component is already wrapped with PremiumRoute in App.tsx
  // so we assume the user is premium if they can access this page
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          {!isScenarioSelected ? (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-center text-brand-dark">Choose a scenario or upload your script to start practicing</h2>
              </div>
              
              <ScenarioSelector onSelectScenario={handleScenarioSelect} />
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-brand-dark">Upload Your Script</h2>
                <ScriptUpload onScriptSubmit={handleScriptSubmit} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-dark">Role Play Practice</h1>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
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
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVoiceMode('voice')}
                      className={voiceMode === 'voice' ? "bg-brand-blue/20 text-brand-dark" : ""}
                    >
                      Voice
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVoiceMode('text')}
                      className={voiceMode === 'text' ? "bg-brand-blue/20 text-brand-dark" : ""}
                    >
                      Text
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVoiceMode('hybrid')}
                      className={voiceMode === 'hybrid' ? "bg-brand-blue/20 text-brand-dark" : ""}
                    >
                      Hybrid
                    </Button>
                  </div>
                </div>
                
                <ConversationInterface 
                  mode={voiceMode} 
                  scenario={scenario} 
                  voiceStyle={voiceStyle}
                  volume={volume}
                  userScript={userScript}
                />
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
    </div>
  );
};

export default RolePlay;
