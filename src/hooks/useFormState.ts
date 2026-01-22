
import { useState, useCallback } from 'react';

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  touched: Record<string, boolean>;
}

interface UseFormStateOptions {
  resetSuccessAfter?: number;
  resetErrorAfter?: number;
}

export const useFormState = (options: UseFormStateOptions = {}) => {
  const { resetSuccessAfter = 3000, resetErrorAfter = 5000 } = options;
  
  const [state, setState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    touched: {}
  });

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const setSuccess = useCallback((message?: string) => {
    setState(prev => ({ 
      ...prev, 
      isSuccess: true, 
      error: null,
      isSubmitting: false 
    }));
    
    if (resetSuccessAfter > 0) {
      setTimeout(() => {
        setState(prev => ({ ...prev, isSuccess: false }));
      }, resetSuccessAfter);
    }
  }, [resetSuccessAfter]);

  const setError = useCallback((error: string) => {
    setState(prev => ({ 
      ...prev, 
      error, 
      isSuccess: false,
      isSubmitting: false 
    }));
    
    if (resetErrorAfter > 0) {
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, resetErrorAfter);
    }
  }, [resetErrorAfter]);

  const setFieldTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [fieldName]: touched }
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      touched: {}
    });
  }, []);

  const isFieldTouched = useCallback((fieldName: string) => {
    return state.touched[fieldName] || false;
  }, [state.touched]);

  return {
    ...state,
    setSubmitting,
    setSuccess,
    setError,
    setFieldTouched,
    isFieldTouched,
    reset
  };
};
