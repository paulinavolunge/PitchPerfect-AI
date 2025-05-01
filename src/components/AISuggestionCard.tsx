
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface AISuggestionCardProps {
  title: string;
  description: string;
  type: 'tip' | 'script';
  onApply?: (title: string, description: string, type: 'tip' | 'script') => void;
}

const AISuggestionCard = ({ title, description, type, onApply }: AISuggestionCardProps) => {
  const { toast } = useToast();
  const isScript = type === 'script';
  
  const handleApply = () => {
    if (onApply) {
      onApply(title, description, type);
    } else {
      // Fallback toast notification if no handler provided
      toast({
        title: isScript ? "Script Applied" : "Tip Applied",
        description: isScript 
          ? "Script has been copied to your clipboard" 
          : "This tip has been noted for your practice sessions",
      });

      // Copy to clipboard as fallback behavior
      navigator.clipboard.writeText(description)
        .then(() => {
          toast({
            title: "Copied to clipboard",
            description: `${isScript ? "Script" : "Tip"} has been copied to your clipboard`,
          });
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
          toast({
            title: "Copy failed",
            description: "Please try selecting and copying the text manually",
            variant: "destructive",
          });
        });
    }
  };
  
  return (
    <Card className={`overflow-hidden ${isScript ? 'border-brand-green/30' : 'border-brand-blue'}`}>
      <div className={`h-2 ${isScript ? 'bg-brand-green' : 'bg-brand-blue'}`}></div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium text-lg text-brand-dark">{title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isScript ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-blue/30 text-blue-700'
          }`}>
            {isScript ? 'Script' : 'Tip'}
          </span>
        </div>
        <p className="text-brand-dark/70 mb-4 text-sm">
          {description}
        </p>
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs ${
              isScript ? 'text-brand-green hover:bg-brand-green/10' : 'text-blue-700 hover:bg-brand-blue/20'
            }`}
            onClick={handleApply}
          >
            {isScript ? 'Use Script' : 'Apply Tip'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISuggestionCard;
