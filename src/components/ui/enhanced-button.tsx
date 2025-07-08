
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  enhanced?: boolean;
  children: React.ReactNode;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  enhanced = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    {
      // Enhanced primary button with bright blue (#0055FF)
      "bg-[#0055FF] text-white border-2 border-[#0044DD] hover:bg-[#0044DD] hover:border-[#0033BB] shadow-lg hover:shadow-xl transform hover:scale-105": enhanced && variant === 'primary',
      // Mobile touch targets (44px minimum)
      "min-h-[44px] px-6 py-3 text-lg": size === 'lg',
      "min-h-[44px] px-4 py-2": size === 'md',
      "min-h-[36px] px-3 py-1": size === 'sm',
      // Full width
      "w-full": fullWidth,
    },
    className
  );

  return (
    <Button
      className={baseClasses}
      disabled={disabled || loading}
      aria-label={typeof children === 'string' ? children : undefined}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" aria-hidden="true" />
      )}
      {Icon && !loading && <Icon className="h-4 w-4 mr-2" aria-hidden="true" />}
      {children}
    </Button>
  );
};
