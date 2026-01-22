
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, Mic, MessageSquare, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickStartGuideProps {
  onStartTour?: () => void;
  className?: string;
}

const QuickStartGuide: React.FC<QuickStartGuideProps> = ({ 
  onStartTour,
  className = ""
}) => {
  const navigate = useNavigate();
  
  return (
    <Card className={`border-brand-green/30 ${className}`}>
      <CardHeader className="bg-brand-green/5 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-green" />
          <CardTitle>Quick Start Guide</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Getting Started with PitchPerfect AI</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 bg-brand-green/20 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <div>
                <h4 className="font-medium">Step 1: Choose Your Practice Mode</h4>
                <p className="text-sm text-brand-dark/70 mt-1">
                  Decide whether you want to practice with a basic recording session or try an interactive roleplay scenario.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 bg-brand-green/20 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <div>
                <h4 className="font-medium">Step 2: Record Your Pitch</h4>
                <p className="text-sm text-brand-dark/70 mt-1">
                  Use the microphone button to record your sales pitch. You can upload your own script or use our templates.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 bg-brand-green/20 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <div>
                <h4 className="font-medium">Step 3: Get AI Feedback</h4>
                <p className="text-sm text-brand-dark/70 mt-1">
                  Receive instant analysis on your pitch with actionable suggestions for improvement.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 bg-brand-green/20 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-brand-green" />
              </div>
              <div>
                <h4 className="font-medium">Step 4: Track Your Progress</h4>
                <p className="text-sm text-brand-dark/70 mt-1">
                  View your improvement over time, earn badges, and reach milestones as you consistently practice.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <Button 
              onClick={() => navigate('/practice')} 
              className="flex items-center justify-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Practice Session
            </Button>
            
            <Button 
              onClick={() => navigate('/roleplay')} 
              className="flex items-center justify-center gap-2"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4" />
              Try AI Roleplay
            </Button>
          </div>
          
          {onStartTour && (
            <div className="text-center pt-4">
              <Button 
                variant="link" 
                onClick={onStartTour}
                className="text-brand-green"
              >
                Take an interactive tour
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStartGuide;
