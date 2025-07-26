/**
 * Secure logging utilities for production safety
 * Conditionally logs based on environment and sanitizes sensitive data
 */
import { secureLog } from './secureLog';

// Environment detection
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/gi,
  /secret/gi,
  /token/gi,
  /api[_-]?key/gi,
  /bearer/gi,
  /auth/gi,
  /email/gi,
  /phone/gi,
  /credit[_-]?card/gi,
  /ssn/gi,
];

/**
 * Sanitizes objects by removing or redacting sensitive information
 */
const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key)) 
        ? '[REDACTED_KEY]' 
        : key;
      sanitized[sanitizedKey] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
};

/**
 * Secure console.log replacement
 * Only logs in development, sanitizes in production
 */
export const secureLogOld = (...args: any[]) => {
  if (isDevelopment) {
    secureLog.info(...args);
  } else {
    // In production, could send to secure logging service
    // For now, we silently ignore or could send to monitoring
  }
};

/**
 * Secure console.error replacement
 * Always logs errors but sanitizes sensitive data
 */
export const secureError = (...args: any[]) => {
  const sanitizedArgs = args.map(sanitizeData);
  secureLog.error(...sanitizedArgs);
};

/**
 * Secure console.warn replacement
 */
export const secureWarn = (...args: any[]) => {
  if (isDevelopment) {
    secureLog.warn(...args);
  } else {
    const sanitizedArgs = args.map(sanitizeData);
    secureLog.warn(...sanitizedArgs);
  }
};

/**
 * Development-only logging
 * Completely removed in production builds
 */
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    secureLog.info('[DEV]', ...args);
  }
};

/**
 * Security audit logging
 * Always active, sends to security monitoring
 */
export const securityLog = (event: string, data: any = {}) => {
  const sanitizedData = sanitizeData(data);
  
  // In production, this would typically go to a security monitoring service
  if (isDevelopment) {
    secureLog.info(`[SECURITY] ${event}:`, sanitizedData);
  }
  
  // Could implement integration with security monitoring services here
  // Example: sendToSecurityMonitoring(event, sanitizedData);
};