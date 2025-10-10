import { supabase } from '@/integrations/supabase/client';

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
        console.error('Credit deduction error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Credit deduction failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch user profile'
      };
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
        console.error('Security event logging failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Security event logging error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to log security event'
      };
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch pitch recordings'
      };
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create pitch recording'
      };
    }
  }
}
