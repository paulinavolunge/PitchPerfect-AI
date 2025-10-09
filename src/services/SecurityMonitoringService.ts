import { supabase } from '@/integrations/supabase/client';
import { SafeRPCService } from './SafeRPCService';

export class SecurityMonitoringService {
  // Enhanced error message sanitization
  static sanitizeErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return this.cleanSensitiveData(error);
    }
    
    if (error instanceof Error) {
      return this.cleanSensitiveData(error.message);
    }
    
    return 'An unexpected error occurred';
  }

  private static cleanSensitiveData(message: string): string {
    return message
      // Remove passwords, keys, tokens
      .replace(/password|secret|key|token|bearer|auth/gi, '[REDACTED]')
      // Remove potential IDs and numbers
      .replace(/\b\d{4,}\b/g, '[ID]')
      // Remove email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      // Remove potential encoded data
      .replace(/\b[A-Za-z0-9+/=]{20,}\b/g, '[ENCODED]')
      .trim()
      .substring(0, 500); // Limit length
  }

  // Log security events with enhanced data
  static async logSecurityEvent(
    eventType: string,
    details: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    // SECURITY: user_id is now required for security logs
    if (!userId) {
      console.warn('[SecurityMonitoring] Skipping security event - user_id required:', eventType);
      return;
    }

    const sanitizedDetails = this.sanitizeEventDetails(details);
    await SafeRPCService.logSecurityEvent(eventType, sanitizedDetails, userId);
  }

  private static sanitizeEventDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string') {
        sanitized[key] = this.cleanSensitiveData(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeEventDetails(value);
      } else {
        sanitized[key] = String(value).substring(0, 100);
      }
    }
    
    return sanitized;
  }

  // Check security health
  static async performSecurityHealthCheck(): Promise<any> {
    const result = await SafeRPCService.securityHealthCheck();
    
    if (!result.healthy) {
      await this.logSecurityEvent('security_health_check_failed', {
        error: 'Health check failed'
      });
    }
    
    return result.details;
  }

  // Enhanced input validation
  static validateInput(input: string, maxLength = 5000): { valid: boolean; error?: string; sanitizedInput?: string; wasSanitized?: boolean } {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Input cannot be empty' };
    }

    if (input.length > maxLength) {
      return { valid: false, error: `Input too long (max ${maxLength} characters)` };
    }

    // Basic XSS protection
    const sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();

    return {
      valid: true,
      sanitizedInput: sanitized,
      wasSanitized: input !== sanitized
    };
  }

  // Rate limiting check
  static async checkRateLimit(
    userId: string,
    action: string,
    maxAttempts = 10,
    windowMinutes = 5
  ): Promise<boolean> {
    try {
      // This would typically be implemented with a more sophisticated rate limiting service
      // For now, we'll use the existing voice rate limit function
      return await this.checkVoiceRateLimit(userId);
    } catch (error) {
      await this.logSecurityEvent('rate_limit_check_failed', {
        action,
        error: this.sanitizeErrorMessage(error)
      }, userId);
      return false;
    }
  }

  private static async checkVoiceRateLimit(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('voice_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .gte('window_start', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw error;
      }

      if (!data) {
        return true; // No rate limit record found, allow request
      }

      return data.request_count < 10; // Allow up to 10 requests per 5-minute window
    } catch (error) {
      // Default to allowing the request if we can't check
      return true;
    }
  }

  // File validation with enhanced security
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = [
      'audio/wav',
      'audio/mp3', 
      'audio/mpeg',
      'audio/m4a',
      'audio/aac'
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 25MB)' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Invalid filename characters
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        return { valid: false, error: 'Invalid file name' };
      }
    }

    return { valid: true };
  }

  // Content Security Policy violation handler
  static handleCSPViolation(violationData: any): void {
    this.logSecurityEvent('csp_violation', {
      blocked_uri: violationData.blockedURI,
      violated_directive: violationData.violatedDirective,
      source_file: violationData.sourceFile,
      line_number: violationData.lineNumber
    });
  }
}