
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
      return false; // Fail closed for security
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
        ip_address: 'unknown', // Will be detected server-side
        request_count: (data?.request_count || 0) + 1,
        window_start: data?.window_start || now,
        updated_at: now
      });

    return true;
  } catch (error) {
    return false; // Fail closed for security
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
