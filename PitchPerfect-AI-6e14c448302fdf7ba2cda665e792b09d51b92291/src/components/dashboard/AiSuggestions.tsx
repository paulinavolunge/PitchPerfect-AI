import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb } from 'lucide-react';
import TiltCard from '@/components/animations/TiltCard';
import AISuggestionCard from '@/components/AISuggestionCard';
import { AITip } from '@/hooks/use-dashboard-data';

interface AiSuggestionsProps {
  tips: AITip[];
}

const AiSuggestions: React.FC<AiSuggestionsProps> = ({ tips }) => {
  if (tips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-brand-blue" />
          <h3 className="font-medium text-xl text-brand-dark">AI Suggestions</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Complete your first practice session to receive personalized AI tips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-brand-blue" />
        <h3 className="font-medium text-xl text-brand-dark">AI Suggestions</h3>
      </div>

      {tips.map((tip) => (
        <TiltCard 
          key={tip.id}
          tiltFactor={2} 
          className="bg-white rounded-lg shadow-sm border border-gray-100"
        >
          <AISuggestionCard
            title={tip.title}
            description={tip.description}
            type={tip.type}
          />
        </TiltCard>
      ))}

      <Link to="/tips">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 hover:scale-105 transition-transform"
        >
          View All Tips
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
};

export default AiSuggestions;
