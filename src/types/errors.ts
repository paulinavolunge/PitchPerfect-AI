// Error codes for user-facing messages
export enum ErrorCode {
  // Authentication
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_TIMEOUT = 'AUTH_TIMEOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Credits
  CREDIT_INSUFFICIENT = 'CREDIT_INSUFFICIENT',
  CREDIT_DEDUCTION_FAILED = 'CREDIT_DEDUCTION_FAILED',
  
  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  
  // File Operations
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  
  // Input Validation
  INPUT_INVALID = 'INPUT_INVALID',
  INPUT_TOO_LONG = 'INPUT_TOO_LONG',
  INPUT_TOO_SHORT = 'INPUT_TOO_SHORT',
  
  // General
  OPERATION_FAILED = 'OPERATION_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// User-friendly error messages
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_FAILED]: 'Authentication failed. Please log in again.',
  [ErrorCode.AUTH_TIMEOUT]: 'Your session has timed out. Please log in again.',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  
  [ErrorCode.UNAUTHORIZED]: 'You do not have permission to access this resource.',
  [ErrorCode.FORBIDDEN]: 'Access to this resource is forbidden.',
  
  [ErrorCode.CREDIT_INSUFFICIENT]: 'You do not have enough credits for this action.',
  [ErrorCode.CREDIT_DEDUCTION_FAILED]: 'Failed to deduct credits. Please try again.',
  
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
  
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit.',
  [ErrorCode.FILE_INVALID_TYPE]: 'Invalid file type. Please upload a supported format.',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed. Please try again.',
  
  [ErrorCode.INPUT_INVALID]: 'Invalid input provided.',
  [ErrorCode.INPUT_TOO_LONG]: 'Input exceeds maximum length.',
  [ErrorCode.INPUT_TOO_SHORT]: 'Input is too short.',
  
  [ErrorCode.OPERATION_FAILED]: 'Operation failed. Please try again.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

// Map common error patterns to error codes
export function mapErrorToCode(error: unknown): ErrorCode {
  if (!error) return ErrorCode.UNKNOWN_ERROR;
  
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('token')) {
    return ErrorCode.AUTH_FAILED;
  }
  
  // Credit errors
  if (errorMessage.includes('credit') || errorMessage.includes('insufficient')) {
    return ErrorCode.CREDIT_INSUFFICIENT;
  }
  
  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return ErrorCode.RATE_LIMITED;
  }
  
  // File errors
  if (errorMessage.includes('file') && errorMessage.includes('large')) {
    return ErrorCode.FILE_TOO_LARGE;
  }
  if (errorMessage.includes('file') && errorMessage.includes('type')) {
    return ErrorCode.FILE_INVALID_TYPE;
  }
  
  // Input validation errors
  if (errorMessage.includes('too long') || errorMessage.includes('exceeds')) {
    return ErrorCode.INPUT_TOO_LONG;
  }
  if (errorMessage.includes('too short') || errorMessage.includes('minimum')) {
    return ErrorCode.INPUT_TOO_SHORT;
  }
  if (errorMessage.includes('invalid')) {
    return ErrorCode.INPUT_INVALID;
  }
  
  return ErrorCode.OPERATION_FAILED;
}

// Get user-friendly error message
export function getUserErrorMessage(error: unknown): string {
  const code = mapErrorToCode(error);
  return ERROR_MESSAGES[code];
}

// Safe error response for APIs/services
export interface SafeErrorResponse {
  success: false;
  code: ErrorCode;
  message: string;
}

export function createSafeErrorResponse(error: unknown): SafeErrorResponse {
  const code = mapErrorToCode(error);
  return {
    success: false,
    code,
    message: ERROR_MESSAGES[code],
  };
}
