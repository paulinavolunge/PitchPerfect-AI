
import { sanitizeStrictly } from '@/lib/sanitizeInput';

/**
 * Enhanced security utilities for input validation and sanitization
 */

// Rate limiting configuration
export const RATE_LIMITS = {
  VOICE_PROCESSING: {
    MAX_REQUESTS: 10,
    WINDOW_MINUTES: 5
  },
  API_CALLS: {
    MAX_REQUESTS: 100,
    WINDOW_MINUTES: 15
  }
};

// Input validation rules
export const INPUT_LIMITS = {
  VOICE_TEXT: 5000,
  FEEDBACK_TEXT: 2000,
  TITLE: 100,
  NOTES: 1000
};

/**
 * Sanitize and validate voice input with enhanced security
 */
export const sanitizeVoiceInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: Voice input must be a non-empty string');
  }

  if (input.length > INPUT_LIMITS.VOICE_TEXT) {
    throw new Error(`Input too long: Maximum ${INPUT_LIMITS.VOICE_TEXT} characters allowed`);
  }

  // Remove potentially dangerous patterns
  const sanitized = sanitizeStrictly(input)
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');

  return sanitized.trim();
};

/**
 * Validate and sanitize file uploads
 */
export const validateAudioFile = (file: File): void => {
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type: Only WAV, MP3, and WebM audio files are allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File too large: Maximum 10MB allowed');
  }

  // Check for suspicious file names
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
  if (suspiciousPatterns.some(pattern => file.name.toLowerCase().includes(pattern))) {
    throw new Error('Suspicious file name detected');
  }
};

/**
 * Security headers for edge functions
 */
export const getSecurityHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
});

/**
 * Sanitize error messages to prevent information disclosure
 */
export const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove sensitive information from error messages
    const sanitized = error.message
      .replace(/password|secret|key|token/gi, '[REDACTED]')
      .replace(/\b\d{4,}\b/g, '[NUMBER]') // Remove long numbers (could be IDs)
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]'); // Remove emails
    
    return sanitizeStrictly(sanitized);
  }
  
  return 'An unexpected error occurred';
};

/**
 * Rate limiting check for voice processing
 */
export const checkVoiceRateLimit = async (userId: string, supabase: any): Promise<boolean> => {
  try {
    const windowStart = new Date(Date.now() - RATE_LIMITS.VOICE_PROCESSING.WINDOW_MINUTES * 60 * 1000);
    
    const { data, error } = await supabase
      .from('voice_rate_limits')
      .select('request_count, blocked_until')
      .eq('user_id', userId)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return false; // Fail open for now, but log the error
    }

    if (data) {
      // Check if user is currently blocked
      if (data.blocked_until && new Date(data.blocked_until) > new Date()) {
        return false;
      }

      // Check if rate limit exceeded
      if (data.request_count >= RATE_LIMITS.VOICE_PROCESSING.MAX_REQUESTS) {
        // Block user for the remaining window time
        const blockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await supabase
          .from('voice_rate_limits')
          .update({ blocked_until: blockUntil.toISOString() })
          .eq('user_id', userId);
        return false;
      }

      // Increment request count
      await supabase
        .from('voice_rate_limits')
        .update({ request_count: data.request_count + 1 })
        .eq('user_id', userId);
    } else {
      // First request in this window
      await supabase
        .from('voice_rate_limits')
        .insert({
          user_id: userId,
          ip_address: '0.0.0.0', // Will be set by edge function
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Fail open to not block legitimate users
  }
};
