
import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="w-full border border-dashed border-gray-200">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {icon}
          </motion.div>
          
          <motion.h3 
            className="text-xl font-medium text-gray-900 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {title}
          </motion.h3>
          
          <motion.p 
            className="text-gray-500 mb-6 max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            {description}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="group">
              <Button 
                onClick={() => navigate(actionRoute)}
                className="bg-brand-green hover:bg-brand-green/90 text-white flex items-center gap-2 w-full sm:w-auto group-hover:shadow-md transition-all"
                aria-label={actionLabel}
              >
                {actionLabel}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
            
            {secondaryAction && (
              <div className="group">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(secondaryAction.route)}
                  className="flex items-center gap-2 w-full sm:w-auto group-hover:shadow-sm transition-all"
                  aria-label={secondaryAction.label}
                >
                  {secondaryAction.label}
                </Button>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyState;
