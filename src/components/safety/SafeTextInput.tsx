
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ContentSafetyIndicator } from '@/components/ui/content-safety-indicator';
import { useContentSafety } from '@/hooks/useContentSafety';
import { SafetyLevel } from '@/utils/contentSafety';
import { cn } from '@/lib/utils';

interface SafeTextInputProps extends React.ComponentProps<typeof Textarea> {
  onSafeValue?: (value: string, isValid: boolean) => void;
  validationType?: string;
  showSafetyIndicator?: boolean;
  maxLength?: number;
}

export const SafeTextInput: React.FC<SafeTextInputProps> = ({
  value: controlledValue,
  onChange,
  onSafeValue,
  validationType = 'USER_MESSAGE',
  showSafetyIndicator = true,
  maxLength = 1000,
  className,
  ...props
}) => {
  const [value, setValue] = useState(controlledValue || '');
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>(SafetyLevel.SAFE);
  const [safetyIssues, setSafetyIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { validateInput } = useContentSafety();

  // Debounced validation
  useEffect(() => {
    if (!value) {
      setSafetyLevel(SafetyLevel.SAFE);
      setSafetyIssues([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      try {
        const result = await validateInput(value, validationType);
        setSafetyLevel(result.isValid ? SafetyLevel.SAFE : SafetyLevel.BLOCKED);
        
        if (onSafeValue) {
          onSafeValue(result.sanitized || value, result.isValid);
        }
      } catch (error) {
        console.error('Validation error:', error);
        setSafetyLevel(SafetyLevel.SUSPICIOUS);
        setSafetyIssues(['Validation failed']);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, validationType, validateInput, onSafeValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Enforce length limit
    if (newValue.length > maxLength) {
      return;
    }
    
    setValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const getSafetyBorderColor = () => {
    switch (safetyLevel) {
      case SafetyLevel.SAFE:
        return 'border-green-200 focus:border-green-400';
      case SafetyLevel.SUSPICIOUS:
        return 'border-yellow-200 focus:border-yellow-400';
      case SafetyLevel.HARMFUL:
      case SafetyLevel.BLOCKED:
        return 'border-red-200 focus:border-red-400';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <Textarea
        {...props}
        value={value}
        onChange={handleChange}
        className={cn(
          getSafetyBorderColor(),
          isValidating && 'opacity-75',
          className
        )}
        disabled={props.disabled || isValidating}
      />
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {showSafetyIndicator && (
            <ContentSafetyIndicator 
              level={safetyLevel} 
              issues={safetyIssues}
            />
          )}
          {isValidating && (
            <span className="text-xs text-muted-foreground">Validating...</span>
          )}
        </div>
        
        <span className={cn(
          "text-xs",
          value.length > maxLength * 0.9 ? "text-yellow-600" : "text-muted-foreground"
        )}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
