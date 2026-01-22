
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ScenarioSelectorProps {
  scenario: {
    difficulty: string;
    objection: string;
    industry: string;
    custom: string;
  };
  onScenarioChange: (scenario: {
    difficulty: string;
    objection: string;
    industry: string;
    custom: string;
  }) => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenario, onScenarioChange }) => {
  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const objections = ['Price', 'Trust', 'Timing', 'Authority', 'Need', 'Competition'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education'];

  const updateScenario = (key: string, value: string) => {
    onScenarioChange({
      ...scenario,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Scenario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select value={scenario.difficulty} onValueChange={(value) => updateScenario('difficulty', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff} value={diff}>{diff}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="objection">Objection Type</Label>
          <Select value={scenario.objection} onValueChange={(value) => updateScenario('objection', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select objection type" />
            </SelectTrigger>
            <SelectContent>
              {objections.map((obj) => (
                <SelectItem key={obj} value={obj}>{obj}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={scenario.industry} onValueChange={(value) => updateScenario('industry', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom">Custom Scenario (Optional)</Label>
          <Textarea
            id="custom"
            placeholder="Describe a specific scenario you'd like to practice..."
            value={scenario.custom}
            onChange={(e) => updateScenario('custom', e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioSelector;
