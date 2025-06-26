
import { supabase } from '@/integrations/supabase/client';

interface FileValidationResult {
  valid: boolean;
  error?: string;
  maxSizeMb?: number;
  allowedTypes?: string[];
}

interface VoiceInputValidationResult {
  valid: boolean;
  sanitizedInput?: string;
  wasSanitized?: boolean;
  error?: string;
}

export class ServerSideValidationService {
  /**
   * Server-side file validation using Supabase function
   */
  static async validateFileUpload(
    fileName: string,
    fileSize: number,
    fileType: string,
    userId?: string
  ): Promise<FileValidationResult> {
    try {
      const { data, error } = await supabase.rpc('validate_file_upload', {
        p_file_name: fileName,
        p_file_size: fileSize,
        p_file_type: fileType,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Server-side file validation error:', error);
        return {
          valid: false,
          error: 'Server validation failed'
        };
      }

      return data as FileValidationResult;
    } catch (error) {
      console.error('File validation service error:', error);
      return {
        valid: false,
        error: 'Validation service unavailable'
      };
    }
  }

  /**
   * Server-side voice input validation
   */
  static async validateVoiceInput(
    input: string,
    userId?: string
  ): Promise<VoiceInputValidationResult> {
    try {
      const { data, error } = await supabase.rpc('validate_voice_input', {
        p_input: input,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Server-side voice validation error:', error);
        return {
          valid: false,
          error: 'Server validation failed'
        };
      }

      return data as VoiceInputValidationResult;
    } catch (error) {
      console.error('Voice input validation service error:', error);
      return {
        valid: false,
        error: 'Validation service unavailable'
      };
    }
  }

  /**
   * Enhanced error message sanitization
   */
  static sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Remove sensitive information patterns
      let sanitized = error.message
        .replace(/password|secret|key|token|api[_-]?key/gi, '[REDACTED]')
        .replace(/\b\d{4,}\b/g, '[ID]') // Long numbers (IDs, phone numbers)
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
        .replace(/https?:\/\/[^\s]+/gi, '[URL]') // URLs
        .replace(/Bearer\s+[^\s]+/gi, 'Bearer [TOKEN]') // Bearer tokens
        .replace(/\b[A-Za-z0-9+/=]{20,}\b/g, '[ENCODED]'); // Base64-like strings

      // Truncate if too long
      if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 197) + '...';
      }

      return sanitized;
    }

    if (typeof error === 'string') {
      return this.sanitizeErrorMessage(new Error(error));
    }

    return 'An unexpected error occurred';
  }

  /**
   * Security health check
   */
  static async performSecurityHealthCheck(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('security_health_check');

      if (error) {
        console.error('Security health check error:', error);
        return {
          status: 'error',
          error: 'Health check failed'
        };
      }

      return data;
    } catch (error) {
      console.error('Security health check service error:', error);
      return {
        status: 'error',
        error: 'Health check service unavailable'
      };
    }
  }

  /**
   * Clean up expired rate limits
   */
  static async cleanupExpiredRateLimits(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_rate_limits');

      if (error) {
        console.error('Rate limit cleanup error:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Rate limit cleanup service error:', error);
      return 0;
    }
  }
}
