
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

const FadeTransition: React.FC<FadeTransitionProps> = ({ 
  show, 
  children, 
  duration = 300,
  className = ""
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Avoid hydration mismatch by only rendering transitions after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={className}>{show ? children : null}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration / 1000 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FadeTransition;
