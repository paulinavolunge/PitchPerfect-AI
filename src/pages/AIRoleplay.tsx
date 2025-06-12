
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bot, MessageCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIRoleplay = () => {
  useEffect(() => {
    console.log('AI Roleplay page loaded');
  }, []);

  const scenarios = [
    { title: "Price Objection", difficulty: "Beginner", description: "Customer thinks your product is too expensive" },
    { title: "Competitor Comparison", difficulty: "Intermediate", description: "Customer is comparing you to a competitor" },
    { title: "Decision Maker Access", difficulty: "Advanced", description: "Need to reach the actual decision maker" },
  ];

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
          <h1 className="text-4xl font-bold text-brand-dark mb-4">
            🤖 AI Roleplay Page
          </h1>
          <p className="text-xl text-brand-dark/70">
            Practice objection handling with realistic AI scenarios
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Choose Your Practice Scenario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <div className="text-sm text-brand-blue font-medium">{scenario.difficulty}</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-brand-dark/70 mb-4">{scenario.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => console.log(`Starting scenario: ${scenario.title}`)}
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
