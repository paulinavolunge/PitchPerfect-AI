
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Please enter a valid email address' })
  .refine(email => !email.endsWith('.con'), {
    message: 'Did you mean .com? Please check your email address',
  });

export const passwordSchema = z.string()
  .min(6, { message: 'Password must be at least 6 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

export const nameSchema = z.string()
  .min(2, { message: 'Name must be at least 2 characters' })
  .max(50, { message: 'Name must be less than 50 characters' })
  .regex(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' });

export const companySchema = z.string()
  .min(1, { message: 'Company name is required' })
  .max(100, { message: 'Company name must be less than 100 characters' });

// Common validation functions
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const formatFieldError = (error: string): string => {
  return error.charAt(0).toUpperCase() + error.slice(1);
};

// Real-time validation debounce utility
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

import React from 'react';
