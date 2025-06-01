
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTAButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
  disabled?: boolean;
}

const CTAButton: React.FC<CTAButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  onClick,
  className,
  showArrow = true,
  disabled = false
}) => {
  const baseStyles = {
    primary: "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7c4aea] hover:to-[#6b2ee0] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300",
    secondary: "bg-white text-[#8B5CF6] border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all duration-300",
    outline: "border-2 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all duration-300"
  };

  const sizeStyles = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-base md:h-10",
    lg: "h-14 px-8 text-lg md:h-12"
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        "flex items-center gap-2 rounded-lg hover:scale-105 transform transition-all duration-300 font-semibold tracking-wide",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {children}
          {showArrow && <ArrowRight className="h-4 w-4" />}
        </>
      )}
    </Button>
  );
};

export default CTAButton;
