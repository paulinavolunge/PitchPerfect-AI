
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReturnToDashboardProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

const ReturnToDashboard = ({ className = '', variant = 'outline' }: ReturnToDashboardProps) => {
  const navigate = useNavigate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          onClick={() => navigate('/dashboard')}
          className={`flex items-center gap-2 ${className}`}
          aria-label="Return to Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Return to Dashboard</TooltipContent>
    </Tooltip>
  );
};

export default ReturnToDashboard;
