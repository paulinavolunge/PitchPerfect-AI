import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import TiltCard from '@/components/animations/TiltCard';
import { Sparkles } from 'lucide-react';

interface QuickPracticeProps {
  credits: number;
  onStartPractice: () => void;
}

const QuickPractice: React.FC<QuickPracticeProps> = ({ credits, onStartPractice }) => {
  const getButtonText = () => {
    if (credits === 0) {
      return 'Top Up Credits to Practice';
    }
    return `Start Practice (${credits} credit${credits !== 1 ? 's' : ''})`;
  };

  const getButtonRoute = () => {
    if (credits === 0) {
      return '/pricing';
    }
    return null; // Use onClick instead
  };

  return (
    <TiltCard 
      tiltFactor={3} 
      glareOpacity={0.1} 
      className="bg-gradient-to-br from-brand-green/5 to-teal-100/20 border-brand-green/30 rounded-lg shadow-sm"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-brand-green" />
          <h3 className="text-xl font-medium text-brand-dark">Quick Practice</h3>
        </div>
        <p className="text-brand-dark/70 mb-6">
          Ready to improve your pitch skills? Start a new practice session now.
        </p>
        <div className="space-y-3">
          {credits === 0 ? (
            <Link to="/pricing" className="block">
              <Button 
                className="w-full bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white hover:scale-105 transition-all"
              >
                {getButtonText()}
              </Button>
            </Link>
          ) : (
            <Button 
              className="w-full bg-gradient-to-r from-[#008D95] to-[#33C3F0] hover:from-[#007a82] hover:to-[#22b2df] text-white hover:scale-105 transition-all" 
              onClick={onStartPractice}
            >
              {getButtonText()}
            </Button>
          )}
          <Link to="/roleplay">
            <Button 
              variant="outline" 
              className="w-full hover:scale-105 transition-transform"
            >
              Try Roleplay Scenarios
            </Button>
          </Link>
        </div>
      </div>
    </TiltCard>
  );
};

export default QuickPractice;
