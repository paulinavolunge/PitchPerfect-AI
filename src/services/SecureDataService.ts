import { supabase } from '@/integrations/supabase/client';
import { createSafeErrorResponse, SafeErrorResponse } from '@/types/errors';

export interface SecureDataResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SecureDataService {
  /**
   * Securely deduct credits from user account
   */
  static async deductCredits(
    userId: string, 
    featureType: string, 
    creditsToDeduct: number
  ): Promise<SecureDataResponse> {
    try {
      // Match current function signature
      const { data, error } = await supabase.rpc('secure_deduct_credits_and_log_usage', {
        p_user_id: userId,
        p_feature_used: featureType
      });

      if (error) {
        console.error('[INTERNAL] Credit deduction error:', error);
        return createSafeErrorResponse(error);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[INTERNAL] Credit deduction failed:', error);
      return createSafeErrorResponse(error);
    }
  }

  /**
   * Get user profile data
   */
  static async getUserProfile(userId: string): Promise<SecureDataResponse> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[INTERNAL] User profile fetch error:', error);
        return createSafeErrorResponse(error);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[INTERNAL] User profile fetch failed:', error);
      return createSafeErrorResponse(error);
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    eventType: string,
    eventDetails: Record<string, any> = {},
    userId?: string
  ): Promise<SecureDataResponse> {
    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: eventDetails,
        p_user_id: userId
      });

      if (error) {
        console.error('[INTERNAL] Security event logging failed:', error);
        return createSafeErrorResponse(error);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[INTERNAL] Security event logging error:', error);
      return createSafeErrorResponse(error);
    }
  }

  /**
   * Get pitch recordings for user
   */
  static async getPitchRecordings(userId: string): Promise<SecureDataResponse> {
    try {
      const { data, error } = await supabase
        .from('pitch_recordings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[INTERNAL] Pitch recordings fetch error:', error);
        return createSafeErrorResponse(error);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[INTERNAL] Pitch recordings fetch failed:', error);
      return createSafeErrorResponse(error);
    }
  }

  /**
   * Create a new pitch recording
   */
  static async createPitchRecording(
    userId: string,
    recordingData: {
      title?: string;
      transcript?: string;
      feedback?: string;
      score?: number;
      duration?: number;
      audio_url?: string;
    }
  ): Promise<SecureDataResponse> {
    try {
      const { data, error } = await supabase
        .from('pitch_recordings')
        .insert({
          user_id: userId,
          ...recordingData
        })
        .select()
        .single();

      if (error) {
        console.error('[INTERNAL] Pitch recording creation error:', error);
        return createSafeErrorResponse(error);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[INTERNAL] Pitch recording creation failed:', error);
      return createSafeErrorResponse(error);
    }
  }
}
