import { supabase } from '@/integrations/supabase/client';

/**
 * Safe RPC Service
 * Wraps all Supabase RPC calls with proper error handling to prevent app crashes
 */
export class SafeRPCService {
  /**
   * Safely execute an RPC call with error handling
   */
  static async call<T = any>(
    functionName: string,
    params: Record<string, any> = {},
    options: {
      throwOnError?: boolean;
      defaultValue?: T;
      logError?: boolean;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    const { throwOnError = false, defaultValue = null, logError = true } = options;

    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        if (logError) {
          console.warn(`RPC call failed: ${functionName}`, { error, params });
        }
        
        if (throwOnError) {
          throw error;
        }
        
        return { data: defaultValue, error };
      }

      return { data, error: null };
    } catch (error) {
      if (logError) {
        console.error(`RPC call exception: ${functionName}`, { error, params });
      }
      
      if (throwOnError) {
        throw error;
      }
      
      return { data: defaultValue, error };
    }
  }

  /**
   * Log a security event safely (fire and forget)
   */
  static async logSecurityEvent(
    eventType: string,
    eventDetails: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    // Don't await, just fire and forget with error handling
    this.call('log_security_event', {
      p_event_type: eventType,
      p_event_details: eventDetails,
      p_user_id: userId
    }, {
      logError: false // Don't spam console with security log failures
    }).catch(() => {
      // Silently ignore security logging failures
    });
  }

  /**
   * Check if user has sufficient credits
   */
  static async checkUserCredits(userId: string): Promise<{ hasCredits: boolean; creditsRemaining: number }> {
    const { data } = await this.call('check_user_credits', {
      p_user_id: userId
    }, {
      defaultValue: { has_credits: false, credits_remaining: 0 }
    });

    return {
      hasCredits: data?.has_credits || false,
      creditsRemaining: data?.credits_remaining || 0
    };
  }

  /**
   * Deduct credits and log usage
   */
  static async deductCredits(userId: string, featureUsed: string): Promise<{ success: boolean; remainingCredits: number }> {
    const { data, error } = await this.call('secure_deduct_credits_and_log_usage', {
      p_user_id: userId,
      p_feature_used: featureUsed
    });

    if (error || !data) {
      return { success: false, remainingCredits: 0 };
    }

    return {
      success: data.success === true,
      remainingCredits: data.remaining_credits || 0
    };
  }

  /**
   * Perform security health check
   */
  static async securityHealthCheck(): Promise<{ healthy: boolean; details: any }> {
    const { data, error } = await this.call('security_health_check', {}, {
      defaultValue: { status: 'error', checks: {} }
    });

    return {
      healthy: !error && data?.status === 'healthy',
      details: data
    };
  }
}