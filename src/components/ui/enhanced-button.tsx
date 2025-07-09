
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
    "inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    {
      // Enhanced primary button with bright blue
      "strong-cta": enhanced && variant === 'primary',
      // Mobile touch targets
      "mobile-cta": size === 'lg',
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
