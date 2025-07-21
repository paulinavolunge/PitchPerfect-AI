import { supabase } from '@/integrations/supabase/client';

// Throttle configuration
const THROTTLE_INTERVAL = 1000; // 1 second
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Track last call times for throttling
const lastCallTimes = new Map<string, number>();
const retryCounters = new Map<string, number>();

/**
 * Safe RPC Service
 * Wraps all Supabase RPC calls with proper error handling to prevent app crashes
 */
export class SafeRPCService {
  /**
   * Check if a call should be throttled
   */
  private static shouldThrottle(key: string): boolean {
    const now = Date.now();
    const lastCall = lastCallTimes.get(key) || 0;
    
    if (now - lastCall < THROTTLE_INTERVAL) {
      return true;
    }
    
    lastCallTimes.set(key, now);
    return false;
  }

  /**
   * Get retry count for a key
   */
  private static getRetryCount(key: string): number {
    return retryCounters.get(key) || 0;
  }

  /**
   * Increment retry count
   */
  private static incrementRetryCount(key: string): void {
    const current = this.getRetryCount(key);
    retryCounters.set(key, current + 1);
  }

  /**
   * Reset retry count
   */
  private static resetRetryCount(key: string): void {
    retryCounters.delete(key);
  }

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
      skipThrottle?: boolean;
    } = {}
  ): Promise<{ data: T | null; error: any }> {
    const { throwOnError = false, defaultValue = null, logError = true, skipThrottle = false } = options;
    const callKey = `${functionName}_${JSON.stringify(params)}`;

    // Check throttling
    if (!skipThrottle && this.shouldThrottle(callKey)) {
      return { data: defaultValue, error: 'Throttled' };
    }

    // Check retry limit
    if (this.getRetryCount(callKey) >= MAX_RETRIES) {
      if (logError) {
        console.warn(`RPC call exceeded retry limit: ${functionName}`);
      }
      return { data: defaultValue, error: 'Max retries exceeded' };
    }

    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        this.incrementRetryCount(callKey);
        
        // Handle rate limit errors
        if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
            error.code === '429' || 
            error.message?.includes('rate limit')) {
          // Wait longer before next retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * this.getRetryCount(callKey)));
        }
        
        if (logError && this.getRetryCount(callKey) === 1) {
          console.warn(`RPC call failed: ${functionName}`, { error, params });
        }
        
        if (throwOnError) {
          throw error;
        }
        
        return { data: defaultValue, error };
      }

      // Reset retry count on success
      this.resetRetryCount(callKey);
      return { data, error: null };
    } catch (error) {
      this.incrementRetryCount(callKey);
      
      if (logError && this.getRetryCount(callKey) === 1) {
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
    // Throttle security events more aggressively
    const throttleKey = `security_${eventType}_${userId || 'anonymous'}`;
    if (this.shouldThrottle(throttleKey)) {
      return;
    }

    // Don't await, just fire and forget with error handling
    this.call('log_security_event', {
      p_event_type: eventType,
      p_event_details: eventDetails,
      p_user_id: userId
    }, {
      logError: false, // Don't spam console with security log failures
      skipThrottle: true // Already throttled above
    }).catch((error) => {
      // Silently ignore security logging failures
      // Reset retry count after some time to allow future attempts
      setTimeout(() => {
        this.resetRetryCount(`log_security_event_${JSON.stringify({ p_event_type: eventType, p_event_details: eventDetails, p_user_id: userId })}`);
      }, 60000); // Reset after 1 minute
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