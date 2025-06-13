
import { EnhancedSecurityService } from '@/services/EnhancedSecurityService';

// Re-export commonly used security utilities for backward compatibility
export const {
  validateAudioFile,
  sanitizeVoiceInput,
  getSecurityHeaders,
  logSecurityEvent,
  checkVoiceRateLimit,
  secureDeductCredits
} = EnhancedSecurityService;

// Additional utility functions
export const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove sensitive information from error messages
    const sanitized = error.message
      .replace(/password|secret|key|token/gi, '[REDACTED]')
      .replace(/\b\d{4,}\b/g, '[NUMBER]') // Remove long numbers (could be IDs)
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]'); // Remove emails
    
    return sanitized;
  }
  
  return 'An unexpected error occurred';
};

export const createSecureFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      formData.append(key, EnhancedSecurityService.sanitizeVoiceInput(value));
    } else if (value instanceof File) {
      const validation = EnhancedSecurityService.validateAudioFile(value);
      if (validation.valid) {
        formData.append(key, value);
      } else {
        throw new Error(validation.error);
      }
    } else {
      formData.append(key, String(value));
    }
  });
  
  return formData;
};

// Rate limiting constants
export const RATE_LIMITS = {
  VOICE_PROCESSING: {
    MAX_REQUESTS: 10,
    WINDOW_MINUTES: 5
  },
  API_CALLS: {
    MAX_REQUESTS: 100,
    WINDOW_MINUTES: 15
  }
} as const;

// Input validation limits
export const INPUT_LIMITS = {
  VOICE_TEXT: 5000,
  FEEDBACK_TEXT: 2000,
  TITLE: 100,
  NOTES: 1000
} as const;
