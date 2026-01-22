
import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';

interface RefreshAnimationProps {
  isRefreshing: boolean;
}

const RefreshAnimation: React.FC<RefreshAnimationProps> = ({ isRefreshing }) => {
  return (
    <div className="relative inline-flex items-center">
      <motion.div
        animate={{
          rotate: isRefreshing ? 360 : 0,
        }}
        transition={{
          duration: 1,
          ease: "easeInOut",
          repeat: isRefreshing ? Infinity : 0,
        }}
      >
        <RefreshCcw 
          size={20} 
          className={`transition-opacity ${isRefreshing ? 'text-brand-blue' : 'text-gray-400'}`} 
        />
      </motion.div>
      
      {isRefreshing && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="ml-2 text-xs text-brand-blue"
        >
          Refreshing...
        </motion.span>
      )}
    </div>
  );
};

export default RefreshAnimation;
