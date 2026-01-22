import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  showArrow?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ 
    variant = 'primary', 
    loading = false, 
    showArrow = true, 
    fullWidth = false, 
    children, 
    className, 
    ...props 
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'secondary':
          return 'bg-white text-[#8B5CF6] border border-[#8B5CF6] hover:bg-gray-50';
        case 'outline':
          return 'border-2 border-[#8B5CF6] bg-transparent text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white';
        default:
          return 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white hover:from-[#7C3AED] hover:to-[#6D28D9]';
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'font-semibold transition-all duration-200',
          getVariantClasses(),
          fullWidth && 'w-full',
          className
        )}
        disabled={loading}
        {...props}
      >
        {loading ? (
          'Loading...'
        ) : (
          <>
            {children}
            {showArrow && <ArrowRight className="ml-2 h-4 w-4" data-testid="arrow-right-icon" />}
          </>
        )}
      </Button>
    );
  }
);

CTAButton.displayName = 'CTAButton';

export default CTAButton;