
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, FileAudio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  icon?: React.ReactNode;
  secondaryAction?: {
    label: string;
    route: string;
  };
}

const EmptyState = ({
  title,
  description,
  actionLabel = "Start Practice",
  actionRoute = "/practice",
  icon = <BarChart className="h-12 w-12 text-gray-300 mb-4" />,
  secondaryAction
}: EmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full border border-dashed border-gray-200">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        {icon}
        <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 max-w-md">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            onClick={() => navigate(actionRoute)}
            className="bg-brand-green hover:bg-brand-green/90 text-white flex items-center gap-2 w-full sm:w-auto"
          >
            {actionLabel}
            <ArrowRight size={16} />
          </Button>
          
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={() => navigate(secondaryAction.route)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
