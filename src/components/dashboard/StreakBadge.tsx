
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from 'framer-motion';

interface StreakBadgeProps {
  streakCount: number;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streakCount }) => {
  // Don't show badge for zero streaks
  if (streakCount === 0) return null;
  
  // Determine badge color based on streak length
  const getBadgeClasses = () => {
    if (streakCount >= 10) return "bg-orange-500 hover:bg-orange-600";
    if (streakCount >= 7) return "bg-amber-500 hover:bg-amber-600";
    if (streakCount >= 4) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-blue-500 hover:bg-blue-600";
  };

  // Get motivational message based on streak length
  const getStreakMessage = () => {
    if (streakCount >= 10) return "Incredible! You're on fire!";
    if (streakCount >= 7) return "Amazing streak! Keep it going!";
    if (streakCount >= 4) return "Great work! You're building a habit!";
    return "Keep practicing daily to build your streak!";
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <Badge className={`${getBadgeClasses()} text-white px-3 py-1 flex items-center gap-1.5 cursor-default`}>
            <Flame className="w-3.5 h-3.5" />
            <span>{streakCount}-day streak</span>
          </Badge>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getStreakMessage()}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default StreakBadge;
