
import React, { useState, useEffect } from 'react';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Mic, MessageSquare, Volume2, Play, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ConversationInterface from '@/components/roleplay/ConversationInterface';
import ScenarioSelector from '@/components/roleplay/ScenarioSelector';
import ScriptUpload from '@/components/roleplay/ScriptUpload';

const RolePlay = () => {
  const location = useLocation();
  const [mode, setMode] = useState<'voice' | 'text' | 'hybrid'>('text');
  const [scenario, setScenario] = useState({
    difficulty: 'Beginner',
    objection: 'Price',
    industry: 'Technology',
    custom: ''
  });
  const [voiceStyle, setVoiceStyle] = useState<'friendly' | 'assertive' | 'skeptical' | 'rushed'>('friendly');
  const [volume, setVolume] = useState([75]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [userScript, setUserScript] = useState<string | null>(null);

  // Handle auto-start from AI Roleplay page
  useEffect(() => {
    if (location.state?.autoStart && location.state?.scenario) {
      console.log('Auto-starting roleplay with scenario:', location.state.scenario);
      setScenario(location.state.scenario);
      setSessionStarted(true);
    }
  }, [location.state]);

  const handleStartSession = () => {
    setSessionStarted(true);
  };

  const handleScriptUpload = (script: string) => {
    setUserScript(script);
  };

  if (sessionStarted) {
    return (
      <ResponsiveLayout>
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="mb-4 sm:mb-6">
            <Link 
              to="/roleplay" 
              className="inline-flex items-center text-brand-blue hover:text-brand-blue-dark mb-3 sm:mb-4"
              onClick={() => setSessionStarted(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Link>
            
            <div className="bg-blue-50 border-l-4 border-blue-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h2 className="font-semibold text-brand-dark mb-1 sm:mb-2 text-sm sm:text-base">
                Practice Session: {scenario.industry} - {scenario.objection} Objection
              </h2>
              <p className="text-xs sm:text-sm text-brand-dark/70">
                Difficulty: {scenario.difficulty} | Mode: {mode} | Voice Style: {voiceStyle}
              </p>
            </div>
          </div>

          <ConversationInterface
            mode={mode}
            scenario={scenario}
            voiceStyle={voiceStyle}
            volume={volume[0]}
            userScript={userScript}
          />
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-dark mb-3 sm:mb-4">
            🎭 AI Roleplay Practice
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-brand-dark/70">
            Practice handling objections with realistic AI scenarios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Configuration Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Practice Mode */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  Practice Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <Button
                    variant={mode === 'text' ? 'default' : 'outline'}
                    onClick={() => setMode('text')}
                    className="justify-start text-sm sm:text-base h-10 sm:h-11"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text Only
                  </Button>
                  <Button
                    variant={mode === 'voice' ? 'default' : 'outline'}
                    onClick={() => setMode('voice')}
                    className="justify-start text-sm sm:text-base h-10 sm:h-11"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Only
                  </Button>
                  <Button
                    variant={mode === 'hybrid' ? 'default' : 'outline'}
                    onClick={() => setMode('hybrid')}
                    className="justify-start text-sm sm:text-base h-10 sm:h-11"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Voice + Text
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            {(mode === 'voice' || mode === 'hybrid') && (
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    Voice Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voice-style" className="text-sm sm:text-base">AI Voice Style</Label>
                    <Select value={voiceStyle} onValueChange={(value: any) => setVoiceStyle(value)}>
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Select voice style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly Customer</SelectItem>
                        <SelectItem value="assertive">Assertive Buyer</SelectItem>
                        <SelectItem value="skeptical">Skeptical Prospect</SelectItem>
                        <SelectItem value="rushed">Rushed Decision Maker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume" className="text-sm sm:text-base">Volume: {volume[0]}%</Label>
                    <Slider
                      id="volume"
                      min={0}
                      max={100}
                      step={5}
                      value={volume}
                      onValueChange={setVolume}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Script Upload */}
            <ScriptUpload onScriptUpload={handleScriptUpload} />
          </div>

          {/* Scenario Selection */}
          <div className="space-y-4 sm:space-y-6">
            <ScenarioSelector scenario={scenario} onScenarioChange={setScenario} />

            {/* Start Session */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Ready to Practice?</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={handleStartSession}
                  size="lg"
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  aria-label="Start Roleplay Session"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Roleplay Session
                </Button>
                
                <p className="text-xs sm:text-sm text-gray-600 mt-3 text-center">
                  Your AI conversation partner is ready when you are!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default RolePlay;
