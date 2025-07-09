
import { supabase } from '@/integrations/supabase/client';

export interface CreditDeductionResult {
  success: boolean;
  error?: string;
  remainingCredits?: number;
  creditsUsed?: number;
}

export interface VoiceRateLimit {
  success: boolean;
  blocked: boolean;
  resetTime?: Date;
  requestCount?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedInput?: string;
  wasSanitized?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

export class EnhancedSecurityService {
  /**
   * Securely deduct credits using the atomic database function
   */
  static async secureDeductCredits(
    userId: string, 
    featureType: string, 
    creditsToDeduct: number = 1
  ): Promise<CreditDeductionResult> {
    try {
      const { data, error } = await supabase.rpc('atomic_deduct_credits', {
        p_user_id: userId,
        p_feature_used: featureType,
        p_credits_to_deduct: creditsToDeduct
      });

      if (error) {
        console.error('Atomic credit deduction error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        
        if (result.success === true) {
          return {
            success: true,
            remainingCredits: result.remaining_credits,
            creditsUsed: result.credits_used
          };
        } else {
          return {
            success: false,
            error: result.error || 'Credit deduction failed'
          };
        }
      }

      return { 
        success: false, 
        error: 'Invalid response from server' 
      };
    } catch (error) {
      console.error('Atomic credit deduction failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate voice input using the database function
   */
  static async validateVoiceInput(
    input: string,
    userId?: string
  ): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.rpc('validate_voice_input', {
        p_input: input,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Voice input validation error:', error);
        return { 
          valid: false, 
          error: error.message 
        };
      }

      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        
        return {
          valid: result.valid,
          error: result.error,
          sanitizedInput: result.sanitized_input,
          wasSanitized: result.was_sanitized
        };
      }

      return { 
        valid: false, 
        error: 'Invalid validation response' 
      };
    } catch (error) {
      console.error('Voice input validation failed:', error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Check voice processing rate limits
   */
  static async checkVoiceRateLimit(userId: string): Promise<VoiceRateLimit> {
    try {
      const { data, error } = await supabase
        .from('voice_rate_limits')
        .select('blocked_until, request_count, window_start')
        .eq('user_id', userId)
        .gte('window_start', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Rate limit check error:', error);
        return { success: true, blocked: false }; // Fail open for availability
      }

      if (!data) {
        return { success: true, blocked: false };
      }

      const blocked = data.blocked_until && new Date(data.blocked_until) > new Date();
      const resetTime = data.blocked_until ? new Date(data.blocked_until) : undefined;

      return {
        success: true,
        blocked: !!blocked,
        resetTime,
        requestCount: data.request_count || 0
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { success: true, blocked: false }; // Fail open
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    eventType: string,
    eventDetails: Record<string, any> = {},
    userId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: eventDetails,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Security event logging failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Security event logging error:', error);
      return false;
    }
  }

  /**
   * Validate audio file uploads with enhanced security
   */
  static validateAudioFile(file: File): FileValidationResult {
    const maxSize = 25 * 1024 * 1024; // Reduced to 25MB for security
    const allowedTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/m4a',
      'audio/aac'
    ]; // Removed potentially risky formats

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
        fileSize: file.size
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        fileType: file.type
      };
    }

    // Additional file name validation
    if (file.name.length > 255) {
      return {
        valid: false,
        error: 'File name too long (max 255 characters)'
      };
    }

    // Check for dangerous file name patterns
    const dangerousPatterns = [
      /\.\./,
      /[<>:"/\\|?*]/,
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    ];

    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      return {
        valid: false,
        error: 'Invalid file name contains dangerous characters'
      };
    }

    return { 
      valid: true, 
      fileType: file.type, 
      fileSize: file.size 
    };
  }

  /**
   * Server-side file validation using enhanced function
   */
  static async validateFileUploadSecure(
    fileName: string,
    fileSize: number,
    fileType: string,
    userId?: string
  ): Promise<FileValidationResult> {
    try {
      const { data, error } = await supabase.rpc('secure_validate_file_upload', {
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

      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        return {
          valid: result.valid,
          error: result.error
        };
      }

      return {
        valid: false,
        error: 'Invalid server response'
      };
    } catch (error) {
      console.error('File validation service error:', error);
      return {
        valid: false,
        error: 'Validation service unavailable'
      };
    }
  }

  /**
   * Sanitize voice input (client-side basic validation)
   */
  static sanitizeVoiceInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input provided');
    }

    if (input.length > 5000) {
      throw new Error('Input too long (max 5000 characters)');
    }

    // Basic XSS protection
    let sanitized = input.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    return sanitized.trim();
  }

  /**
   * Check user permissions
   */
  static async checkUserPermission(
    userId: string,
    requiredRole: string = 'user'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_user_permission', {
        p_user_id: userId,
        p_required_role: requiredRole
      });

      if (error) {
        console.error('Permission check error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }
}
