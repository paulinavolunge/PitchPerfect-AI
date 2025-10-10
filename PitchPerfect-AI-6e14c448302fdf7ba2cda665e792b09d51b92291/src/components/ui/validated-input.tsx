
import React, { useState, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValidatedInputProps extends Omit<InputProps, 'onChange'> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
  validateOnChange?: (value: string) => string | undefined;
  onChange?: (value: string) => void;
  debounceMs?: number;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  success,
  hint,
  required,
  showPasswordToggle,
  validateOnChange,
  onChange,
  debounceMs = 300,
  type: initialType = 'text',
  className,
  ...props
}) => {
  const [value, setValue] = useState(props.value?.toString() || '');
  const [localError, setLocalError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const type = showPasswordToggle && showPassword ? 'text' : initialType;
  const hasError = error || localError;
  const isSuccess = success && !hasError && touched && value.length > 0;

  // Debounced validation
  useEffect(() => {
    if (!validateOnChange || !touched || !value) {
      setLocalError(undefined);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const validationError = validateOnChange(value);
      setLocalError(validationError);
      setIsValidating(false);
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      setIsValidating(false);
    };
  }, [value, validateOnChange, touched, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setTouched(true);
    onChange?.(newValue);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const getInputClassName = () => {
    return cn(
      "pr-10",
      hasError && "border-red-500 focus-visible:ring-red-300",
      isSuccess && "border-green-500 focus-visible:ring-green-300",
      isValidating && "opacity-75",
      className
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          {...props}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={getInputClassName()}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={
            hasError ? `${props.id}-error` : 
            hint ? `${props.id}-hint` : undefined
          }
        />
        
        {/* Status icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {showPasswordToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
          
          {isValidating && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500" />
          )}
          
          {!isValidating && hasError && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          
          {!isValidating && isSuccess && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
      
      {/* Error message */}
      {hasError && (
        <p 
          id={`${props.id}-error`}
          className="text-sm text-red-600 flex items-center gap-1 animate-fade-in"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {hasError}
        </p>
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
