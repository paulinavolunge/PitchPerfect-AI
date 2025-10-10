
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bot, MessageCircle, Play, Mic } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OnboardingTooltip } from '@/components/onboarding/OnboardingTooltip';

const AIRoleplay = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AI Roleplay page loaded');
  }, []);

  const scenarios = [
    { 
      id: 'price-objection',
      title: "Price Objection", 
      difficulty: "Beginner", 
      description: "Customer thinks your product is too expensive",
      objectionType: "Price",
      industry: "General"
    },
    { 
      id: 'competitor-comparison',
      title: "Competitor Comparison", 
      difficulty: "Intermediate", 
      description: "Customer is comparing you to a competitor",
      objectionType: "Competition",
      industry: "Technology"
    },
    { 
      id: 'decision-maker',
      title: "Decision Maker Access", 
      difficulty: "Advanced", 
      description: "Need to reach the actual decision maker",
      objectionType: "Authority",
      industry: "Business"
    },
  ];

  const handleStartPractice = (scenario: typeof scenarios[0]) => {
    console.log(`Starting scenario: ${scenario.title}`);
    
    // Navigate to the roleplay page with scenario parameters
    navigate('/roleplay', { 
      state: { 
        autoStart: true,
        scenario: {
          difficulty: scenario.difficulty,
          objection: scenario.objectionType,
          industry: scenario.industry,
          custom: scenario.description
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-brand-blue hover:text-brand-blue-dark">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <OnboardingTooltip
            content="🎙 Ready to roleplay? Type a sales pitch or hit the mic to start practicing. We'll give instant feedback."
            side="bottom"
            showOnFirstVisit={true}
            storageKey="ai-roleplay-welcome"
          >
            <h1 className="text-4xl font-bold text-brand-dark mb-4">
              🤖 AI Roleplay Page
            </h1>
          </OnboardingTooltip>
          <p className="text-xl text-brand-dark/70">
            Practice objection handling with realistic AI scenarios
          </p>
        </div>

        {/* Mic setup shortcut for tests and users */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" data-testid="mic-test" aria-label="microphone setup">
            <Mic className="h-4 w-4 mr-2" />
            Microphone Setup
          </Button>
        </div>

        <Card className="mb-8" data-testid="scenario-selector">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Choose Your Practice Scenario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid="scenario-option">
                  <CardHeader>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <div className="text-sm text-brand-blue font-medium">{scenario.difficulty}</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-brand-dark/70 mb-4">{scenario.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleStartPractice(scenario)}
                      data-testid="start-roleplay"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Practice
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              How AI Roleplay Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-brand-dark/70">
              <li>Select a practice scenario based on your skill level</li>
              <li>The AI will play the role of a realistic prospect</li>
              <li>Practice handling objections in real-time</li>
              <li>Receive detailed feedback on your responses</li>
              <li>Improve your objection handling skills</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIRoleplay;
