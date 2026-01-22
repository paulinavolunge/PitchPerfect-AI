
import { EnhancedSecurityService } from '@/services/EnhancedSecurityService';
import { ServerSideValidationService } from '@/services/ServerSideValidationService';
import { SecurityMonitoringService } from '@/services/SecurityMonitoringService';

// Re-export commonly used security utilities for backward compatibility
export const {
  validateAudioFile,
  sanitizeVoiceInput,
  checkVoiceRateLimit,
  secureDeductCredits
} = EnhancedSecurityService;

// Enhanced error message sanitization using monitoring service
export const sanitizeErrorMessage = SecurityMonitoringService.sanitizeErrorMessage;

// Enhanced security monitoring utilities
export const logSecurityEventEnhanced = SecurityMonitoringService.logSecurityEvent;
export const performSecurityHealthCheckEnhanced = SecurityMonitoringService.performSecurityHealthCheck;
export const validateInputEnhanced = SecurityMonitoringService.validateInput;
export const validateFileEnhanced = SecurityMonitoringService.validateFile;

// Enhanced file validation with server-side verification
export const validateFileWithServerSideCheck = async (
  file: File,
  userId?: string
): Promise<{ valid: boolean; error?: string }> => {
  // Client-side pre-validation
  const clientValidation = EnhancedSecurityService.validateAudioFile(file);
  if (!clientValidation.valid) {
    return clientValidation;
  }

  // Server-side validation
  try {
    const serverValidation = await ServerSideValidationService.validateFileUpload(
      file.name,
      file.size,
      file.type,
      userId
    );
    return serverValidation;
  } catch (error) {
    return {
      valid: false,
      error: sanitizeErrorMessage(error)
    };
  }
};

// Enhanced voice input validation with server-side verification
export const validateVoiceInputWithServerSideCheck = async (
  input: string,
  userId?: string
): Promise<{ valid: boolean; sanitizedInput?: string; error?: string }> => {
  try {
    // Server-side validation and sanitization
    const serverValidation = await ServerSideValidationService.validateVoiceInput(input, userId);
    return serverValidation;
  } catch (error) {
    return {
      valid: false,
      error: sanitizeErrorMessage(error)
    };
  }
};

// Security monitoring utilities
export const performSecurityHealthCheck = ServerSideValidationService.performSecurityHealthCheck;
export const cleanupExpiredRateLimits = ServerSideValidationService.cleanupExpiredRateLimits;

// Create secure form data with enhanced validation
export const createSecureFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Use client-side sanitization as fallback, server-side validation will be primary
      formData.append(key, EnhancedSecurityService.sanitizeVoiceInput(value));
    } else if (value instanceof File) {
      // File validation will be handled separately with server-side check
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  
  return formData;
};

// Security headers utility function
export const getSecurityHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
});

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
