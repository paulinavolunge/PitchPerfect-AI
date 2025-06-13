import { supabase } from '@/integrations/supabase/client';
import { sanitizeStrictly } from '@/lib/sanitizeInput';

export interface SecurityEventDetails {
  [key: string]: any;
}

export interface VoiceRateLimit {
  success: boolean;
  blocked: boolean;
  remainingRequests?: number;
  resetTime?: Date;
}

export interface CreditDeductionResult {
  success: boolean;
  error?: string;
  remainingCredits?: number;
  creditsUsed?: number;
}

export class EnhancedSecurityService {
  private static readonly RATE_LIMITS = {
    VOICE_PROCESSING: {
      MAX_REQUESTS: 10,
      WINDOW_MINUTES: 5
    },
    API_CALLS: {
      MAX_REQUESTS: 100,
      WINDOW_MINUTES: 15
    }
  };

  /**
   * Securely deduct credits with enhanced error handling and logging
   */
  static async secureDeductCredits(
    userId: string,
    featureType: string,
    creditsToDeduct: number
  ): Promise<CreditDeductionResult> {
    try {
      // Validate inputs
      if (!userId || !featureType || creditsToDeduct < 1) {
        throw new Error('Invalid parameters for credit deduction');
      }

      // Log the attempt
      await this.logSecurityEvent('credit_deduction_attempt', {
        feature_type: featureType,
        credits_requested: creditsToDeduct,
        user_id: userId
      }, userId);

      // Match current function signature
      const { data, error } = await supabase.rpc('secure_deduct_credits_and_log_usage', {
        p_user_id: userId,
        p_feature_used: sanitizeStrictly(featureType)
      });

      if (error) {
        await this.logSecurityEvent('credit_deduction_failed', {
          error: error.message,
          feature_type: featureType,
          user_id: userId
        }, userId);
        return { success: false, error: error.message };
      }

      // Handle the JSONB response
      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        
        if (result.success === true) {
          await this.logSecurityEvent('credit_deduction_success', {
            feature_type: featureType,
            credits_used: result.credits_used,
            remaining_credits: result.remaining_credits,
            user_id: userId
          }, userId);

          return {
            success: true,
            remainingCredits: result.remaining_credits,
            creditsUsed: result.credits_used
          };
        } else {
          await this.logSecurityEvent('credit_deduction_insufficient', {
            error: result.error,
            available: result.available,
            required: result.required,
            user_id: userId
          }, userId);

          return {
            success: false,
            error: result.error || 'Credit deduction failed'
          };
        }
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logSecurityEvent('credit_deduction_error', {
        error: errorMessage,
        feature_type: featureType,
        user_id: userId
      }, userId);

      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Check voice processing rate limits with enhanced tracking
   */
  static async checkVoiceRateLimit(userId: string): Promise<VoiceRateLimit> {
    try {
      const windowStart = new Date(Date.now() - this.RATE_LIMITS.VOICE_PROCESSING.WINDOW_MINUTES * 60 * 1000);
      
      const { data, error } = await supabase
        .from('voice_rate_limits')
        .select('request_count, blocked_until, window_start')
        .eq('user_id', userId)
        .gte('window_start', windowStart.toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Rate limit check error:', error);
        await this.logSecurityEvent('rate_limit_check_error', {
          error: error.message,
          user_id: userId
        }, userId);
        return { success: false, blocked: false };
      }

      if (data) {
        // Check if user is currently blocked
        if (data.blocked_until && new Date(data.blocked_until) > new Date()) {
          await this.logSecurityEvent('rate_limit_blocked_access_attempt', {
            blocked_until: data.blocked_until,
            user_id: userId
          }, userId);
          
          return { 
            success: false, 
            blocked: true, 
            resetTime: new Date(data.blocked_until) 
          };
        }

        // Check if rate limit exceeded
        if (data.request_count >= this.RATE_LIMITS.VOICE_PROCESSING.MAX_REQUESTS) {
          // Block user for the remaining window time
          const blockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
          
          await supabase
            .from('voice_rate_limits')
            .update({ blocked_until: blockUntil.toISOString() })
            .eq('user_id', userId)
            .eq('window_start', data.window_start);

          await this.logSecurityEvent('rate_limit_exceeded', {
            request_count: data.request_count,
            max_requests: this.RATE_LIMITS.VOICE_PROCESSING.MAX_REQUESTS,
            blocked_until: blockUntil.toISOString(),
            user_id: userId
          }, userId);

          return { 
            success: false, 
            blocked: true, 
            resetTime: blockUntil 
          };
        }

        // Increment request count
        await supabase
          .from('voice_rate_limits')
          .update({ 
            request_count: data.request_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('window_start', data.window_start);

        return { 
          success: true, 
          blocked: false, 
          remainingRequests: this.RATE_LIMITS.VOICE_PROCESSING.MAX_REQUESTS - data.request_count - 1 
        };
      } else {
        // First request in this window
        await supabase
          .from('voice_rate_limits')
          .insert({
            user_id: userId,
            ip_address: '0.0.0.0', // Will be set by database function
            request_count: 1,
            window_start: new Date().toISOString()
          });

        return { 
          success: true, 
          blocked: false, 
          remainingRequests: this.RATE_LIMITS.VOICE_PROCESSING.MAX_REQUESTS - 1 
        };
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      await this.logSecurityEvent('rate_limit_system_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId
      }, userId);
      return { success: true, blocked: false }; // Fail open to not block legitimate users
    }
  }

  /**
   * Enhanced security event logging with better error handling
   */
  static async logSecurityEvent(
    eventType: string,
    eventDetails: SecurityEventDetails = {},
    userId?: string
  ): Promise<boolean> {
    try {
      // Sanitize event details
      const sanitizedDetails = this.sanitizeEventDetails(eventDetails);
      
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: sanitizeStrictly(eventType),
        p_event_details: sanitizedDetails,
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
   * Validate and sanitize audio file uploads
   */
  static validateAudioFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only WAV, MP3, WebM, and OGG audio files are allowed.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum 10MB allowed.'
      };
    }

    // Check for suspicious file names
    const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '..'];
    const fileName = file.name.toLowerCase();
    
    if (suspiciousPatterns.some(pattern => fileName.includes(pattern))) {
      return {
        valid: false,
        error: 'Suspicious file name detected.'
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize voice input with comprehensive security checks
   */
  static sanitizeVoiceInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: Voice input must be a non-empty string');
    }

    const maxLength = 5000;
    if (input.length > maxLength) {
      throw new Error(`Input too long: Maximum ${maxLength} characters allowed`);
    }

    // Remove potentially dangerous patterns
    let sanitized = sanitizeStrictly(input)
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/\0/g, ''); // Remove null bytes

    return sanitized.trim();
  }

  /**
   * Get security headers for API responses
   */
  static getSecurityHeaders(): HeadersInit {
    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
  }

  /**
   * Sanitize event details to prevent injection attacks
   */
  private static sanitizeEventDetails(details: SecurityEventDetails): any {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(details)) {
      const cleanKey = sanitizeStrictly(key);
      
      if (typeof value === 'string') {
        sanitized[cleanKey] = sanitizeStrictly(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[cleanKey] = value;
      } else if (value === null || value === undefined) {
        sanitized[cleanKey] = value;
      } else {
        // For objects and arrays, convert to string and sanitize
        sanitized[cleanKey] = sanitizeStrictly(JSON.stringify(value));
      }
    }
    
    return sanitized;
  }

  /**
   * Check if user has sufficient permissions for an action
   */
  static async checkUserPermissions(userId: string, action: string): Promise<boolean> {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        await this.logSecurityEvent('permission_check_error', {
          error: error.message,
          action,
          user_id: userId
        }, userId);
        return false;
      }

      const roles = userRoles?.map(r => r.role) || [];
      
      // Define action-role mappings
      const permissions: Record<string, string[]> = {
        'admin_access': ['admin'],
        'manager_access': ['admin', 'manager'],
        'user_access': ['admin', 'manager', 'user']
      };

      const requiredRoles = permissions[action] || ['user'];
      const hasPermission = roles.some(role => requiredRoles.includes(role));

      if (!hasPermission) {
        await this.logSecurityEvent('unauthorized_access_attempt', {
          action,
          user_roles: roles,
          required_roles: requiredRoles,
          user_id: userId
        }, userId);
      }

      return hasPermission;
    } catch (error) {
      await this.logSecurityEvent('permission_check_system_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action,
        user_id: userId
      }, userId);
      return false;
    }
  }
}
