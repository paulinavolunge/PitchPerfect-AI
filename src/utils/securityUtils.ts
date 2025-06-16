
import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced security utilities for voice processing and data validation
 */

export const sanitizeVoiceInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input provided');
  }

  if (input.length > 5000) {
    throw new Error('Input exceeds maximum length of 5000 characters');
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove common XSS patterns
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized.trim();
};

export const checkVoiceRateLimit = async (
  userId: string,
  supabaseClient = supabase
): Promise<boolean> => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const { data, error } = await supabaseClient
      .from('voice_rate_limits')
      .select('request_count, blocked_until, window_start')
      .eq('user_id', userId)
      .gte('window_start', fiveMinutesAgo.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return true; // Fail open to allow processing
    }

    // Check if user is currently blocked
    if (data?.blocked_until && new Date(data.blocked_until) > new Date()) {
      return false;
    }

    // Check if user has exceeded rate limit (10 requests per 5 minutes)
    if (data?.request_count && data.request_count >= 10) {
      // Block user for 5 minutes
      await supabaseClient
        .from('voice_rate_limits')
        .update({
          blocked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId);
      
      return false;
    }

    // Update or insert rate limit record
    const now = new Date().toISOString();
    await supabaseClient
      .from('voice_rate_limits')
      .upsert({
        user_id: userId,
        ip_address: '127.0.0.1', // Will be updated by RLS if available
        request_count: (data?.request_count || 0) + 1,
        window_start: data?.window_start || now,
        updated_at: now
      });

    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail open
  }
};

export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/m4a',
    'audio/webm',
    'audio/ogg'
  ];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  return { valid: true };
};

export const logSecurityEvent = async (
  eventType: string,
  eventDetails: Record<string, any> = {},
  userId?: string
): Promise<void> => {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_event_details: eventDetails,
      p_user_id: userId || null
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - security logging should not break functionality
  }
};

export const validateUserInput = (input: string): { valid: boolean; error?: string } => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input must be a non-empty string' };
  }

  if (input.length > 10000) {
    return { valid: false, error: 'Input too long (max 10000 characters)' };
  }

  // Check for common injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /on\w+\s*=/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return { valid: false, error: 'Input contains potentially dangerous content' };
    }
  }

  return { valid: true };
};
