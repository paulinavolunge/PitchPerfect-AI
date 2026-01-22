
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ContentSafetyIndicator } from '@/components/ui/content-safety-indicator';
import { useContentSafety } from '@/hooks/useContentSafety';
import { SafetyLevel } from '@/utils/contentSafety';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SafeTextInputProps extends React.ComponentProps<typeof Textarea> {
  onSafeValue?: (value: string, isValid: boolean) => void;
  validationType?: string;
  showSafetyIndicator?: boolean;
  maxLength?: number;
  label?: string;
  hint?: string;
  required?: boolean;
}

export const SafeTextInput: React.FC<SafeTextInputProps> = ({
  value: controlledValue,
  onChange,
  onSafeValue,
  validationType = 'USER_MESSAGE',
  showSafetyIndicator = true,
  maxLength = 1000,
  label,
  hint,
  required,
  className,
  ...props
}) => {
  const getStringValue = (val: string | number | readonly string[] | undefined): string => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return val.toString();
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  const [value, setValue] = useState(getStringValue(controlledValue));
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>(SafetyLevel.SAFE);
  const [safetyIssues, setSafetyIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouched] = useState(false);
  const { validateInput } = useContentSafety();

  useEffect(() => {
    const stringValue = getStringValue(controlledValue);
    setValue(stringValue);
  }, [controlledValue]);

  // Debounced validation
  useEffect(() => {
    if (!value || !touched) {
      setSafetyLevel(SafetyLevel.SAFE);
      setSafetyIssues([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      try {
        const result = await validateInput(value, validationType);
        setSafetyLevel(result.isValid ? SafetyLevel.SAFE : SafetyLevel.BLOCKED);
        setSafetyIssues(result.isValid ? [] : ['Content may be inappropriate']);
        
        if (onSafeValue) {
          onSafeValue(result.sanitized || value, result.isValid);
        }
      } catch (error) {
        console.error('Validation error:', error);
        setSafetyLevel(SafetyLevel.SUSPICIOUS);
        setSafetyIssues(['Validation failed - please try again']);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, validationType, validateInput, onSafeValue, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (newValue.length > maxLength) {
      return;
    }
    
    setValue(newValue);
    setTouched(true);
    
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const getSafetyBorderColor = () => {
    if (!touched) return '';
    
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

  const getCharacterCountColor = () => {
    const percentage = value.length / maxLength;
    if (percentage >= 0.9) return "text-red-600";
    if (percentage >= 0.8) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const hasError = safetyLevel === SafetyLevel.BLOCKED || safetyLevel === SafetyLevel.HARMFUL;
  const isSuccess = touched && value.length > 0 && safetyLevel === SafetyLevel.SAFE;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Textarea
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "min-h-[100px] text-base resize-none transition-colors",
            getSafetyBorderColor(),
            isValidating && 'opacity-75',
            className
          )}
          disabled={props.disabled || isValidating}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={
            hasError ? `${props.id}-error` : 
            hint ? `${props.id}-hint` : undefined
          }
        />
        
        {/* Status indicator in top-right corner */}
        {touched && !isValidating && (
          <div className="absolute top-3 right-3">
            {isSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
          </div>
        )}
      </div>
      
      {/* Character count and status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showSafetyIndicator && (
            <ContentSafetyIndicator 
              level={safetyLevel} 
              issues={safetyIssues}
              className="flex-shrink-0"
            />
          )}
          {isValidating && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-500" />
              Checking content...
            </div>
          )}
        </div>
        
        <span className={cn(
          "text-xs flex-shrink-0",
          getCharacterCountColor()
        )}>
          {value.length}/{maxLength}
        </span>
      </div>
      
      {/* Error messages */}
      {hasError && safetyIssues.length > 0 && (
        <div 
          id={`${props.id}-error`}
          className="text-sm text-red-600 flex items-start gap-1 animate-fade-in"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            {safetyIssues.map((issue, index) => (
              <p key={index}>{issue}</p>
            ))}
          </div>
        </div>
      )}
      
      {/* Hint text */}
      {!hasError && hint && (
        <p 
          id={`${props.id}-hint`}
          className="text-sm text-gray-500"
        >
          {hint}
        </p>
      )}
    </div>
  );
};
