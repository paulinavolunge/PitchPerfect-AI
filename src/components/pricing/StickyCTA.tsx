
import React from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

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
            onClick={onClick}
            size="lg"
            className="rounded-full px-6 py-6 h-auto shadow-lg hover:shadow-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-medium"
          >
            {text}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCTA;
