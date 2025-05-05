
import React from 'react';
import { Button } from '@/components/ui/button';

interface StickyCTAProps {
  show: boolean;
  onClick: () => void;
}

const StickyCTA: React.FC<StickyCTAProps> = ({ show, onClick }) => {
  if (!show) return null;

  return (
    <div className="sticky-cta fixed bottom-6 left-0 right-0 flex justify-center z-40">
      <Button 
        onClick={onClick} 
        className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-6 rounded-full shadow-lg animate-bounce-subtle"
        size="lg"
      >
        Try It Free
      </Button>
    </div>
  );
};

export default StickyCTA;
