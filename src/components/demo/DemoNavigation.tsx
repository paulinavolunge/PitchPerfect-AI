
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface DemoNavigationProps {
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  onHelp?: () => void;
  showProgress?: boolean;
}

const DemoNavigation: React.FC<DemoNavigationProps> = ({
  currentStep = 1,
  totalSteps = 3,
  onBack,
  onHelp,
  showProgress = true
}) => {
  const navigate = useNavigate();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack || (() => navigate(-1))}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHelp}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
        
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Demo Progress</span>
              <span>Step {currentStep} of {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoNavigation;
