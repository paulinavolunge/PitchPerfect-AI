
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface StickyCTAProps {
  show: boolean;
  onClick: () => void;
  text?: string;
}

const StickyCTA: React.FC<StickyCTAProps> = ({ 
  show = true, 
  onClick,
  text = "Try Free Demo"
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="fixed bottom-6 right-6 z-40 sticky-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={handleClick}
            disabled={isLoading}
            size="lg"
            aria-label={`${text} - Sticky call to action button`}
            className="rounded-full px-6 py-6 h-auto shadow-lg hover:shadow-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-medium transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 animate-pulse-gentle"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              text
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCTA;
