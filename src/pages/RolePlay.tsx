
import React, { useState } from 'react';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Mic, MessageSquare, Volume2, Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConversationInterface from '@/components/roleplay/ConversationInterface';
import ScenarioSelector from '@/components/roleplay/ScenarioSelector';
import ScriptUpload from '@/components/roleplay/ScriptUpload';

const RolePlay = () => {
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

  const handleStartSession = () => {
    setSessionStarted(true);
  };

  const handleScriptUpload = (script: string) => {
    setUserScript(script);
  };

  if (sessionStarted) {
    return (
      <ResponsiveLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link 
              to="/roleplay" 
              className="inline-flex items-center text-brand-blue hover:text-brand-blue-dark mb-4"
              onClick={() => setSessionStarted(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Link>
            
            <div className="bg-blue-50 border-l-4 border-blue-300 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-brand-dark mb-2">
                Practice Session: {scenario.industry} - {scenario.objection} Objection
              </h2>
              <p className="text-sm text-brand-dark/70">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">
            🎭 AI Roleplay Practice
          </h1>
          <p className="text-xl text-brand-dark/70">
            Practice handling objections with realistic AI scenarios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Practice Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Practice Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant={mode === 'text' ? 'default' : 'outline'}
                    onClick={() => setMode('text')}
                    className="justify-start"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text Only
                  </Button>
                  <Button
                    variant={mode === 'voice' ? 'default' : 'outline'}
                    onClick={() => setMode('voice')}
                    className="justify-start"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Only
                  </Button>
                  <Button
                    variant={mode === 'hybrid' ? 'default' : 'outline'}
                    onClick={() => setMode('hybrid')}
                    className="justify-start"
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Voice Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voice-style">AI Voice Style</Label>
                    <Select value={voiceStyle} onValueChange={(value: any) => setVoiceStyle(value)}>
                      <SelectTrigger>
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
                    <Label htmlFor="volume">Volume: {volume[0]}%</Label>
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
          <div className="space-y-6">
            <ScenarioSelector scenario={scenario} onScenarioChange={setScenario} />

            {/* Start Session */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Practice?</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartSession} 
                  size="lg" 
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Roleplay Session
                </Button>
                <p className="text-sm text-brand-dark/60 mt-2 text-center">
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
