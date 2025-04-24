
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ScenarioSelectorProps {
  onSelectScenario: (scenario: {
    difficulty: string;
    objection: string;
    industry: string;
    custom?: string;
  }) => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelectScenario }) => {
  const [difficulty, setDifficulty] = useState('Medium');
  const [objection, setObjection] = useState('Price');
  const [industry, setIndustry] = useState('SaaS');
  const [customScenario, setCustomScenario] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
  const objections = ['Price', 'Urgency', 'Trust', 'Timing', 'Competition', 'Need'];
  const industries = ['SaaS', 'Retail', 'B2B Services', 'Healthcare', 'Finance', 'Real Estate'];

  const handleStartScenario = () => {
    onSelectScenario({
      difficulty,
      objection,
      industry,
      custom: useCustom ? customScenario : undefined
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Choose Your Scenario</h1>
      
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3 text-brand-dark">Difficulty Level</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {difficulties.map((level) => (
                <Button
                  key={level}
                  variant="outline"
                  className={difficulty === level ? "bg-brand-blue/20 border-brand-green" : ""}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-3 text-brand-dark">Objection Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {objections.map((obj) => (
                <Button
                  key={obj}
                  variant="outline"
                  className={objection === obj ? "bg-brand-blue/20 border-brand-green" : ""}
                  onClick={() => setObjection(obj)}
                >
                  {obj}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-3 text-brand-dark">Industry</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {industries.map((ind) => (
                <Button
                  key={ind}
                  variant="outline"
                  className={industry === ind ? "bg-brand-blue/20 border-brand-green" : ""}
                  onClick={() => setIndustry(ind)}
                >
                  {ind}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="useCustom"
                checked={useCustom}
                onChange={() => setUseCustom(!useCustom)}
                className="rounded text-brand-green focus:ring-brand-green"
              />
              <Label htmlFor="useCustom">Use custom scenario</Label>
            </div>
            
            {useCustom && (
              <div className="space-y-2">
                <Label htmlFor="customScenario">Describe your scenario</Label>
                <Input
                  id="customScenario"
                  placeholder="Describe the sales scenario you want to practice..."
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  className="resize-none"
                />
              </div>
            )}
          </div>
          
          <Button 
            className="w-full btn-primary mt-4" 
            onClick={handleStartScenario}
          >
            Start Role Play
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioSelector;
