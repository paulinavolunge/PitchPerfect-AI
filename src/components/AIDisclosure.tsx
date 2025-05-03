
import React from 'react';
import { Info, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface AIDisclosureProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * A component to provide disclosure about AI usage on pages
 * Used to comply with Google Play guidelines for AI transparency
 */
const AIDisclosure = ({
  title = 'AI-Powered Features',
  description = 'This page contains AI-generated content. Results may vary and should be reviewed for accuracy.',
  className,
  variant = 'default',
}: AIDisclosureProps) => {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground mb-2', className)}>
        <Bot size={14} className="text-purple-600" />
        <span>{description}</span>
      </div>
    );
  }

  return (
    <Alert className={cn('bg-purple-50 border-purple-200', className)}>
      <Bot className="h-4 w-4 text-purple-600" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};

export default AIDisclosure;
