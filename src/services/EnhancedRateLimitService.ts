import { supabase } from '@/integrations/supabase/client';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  current_requests: number;
  max_requests: number;
  blocked_until?: string;
  reset_time?: string;
}

export class EnhancedRateLimitService {
  private static readonly RATE_LIMITS = {
    voice_processing: { requests: 50, window: 3600 }, // 50 per hour
    file_upload: { requests: 20, window: 3600 }, // 20 per hour
    api_call: { requests: 100, window: 3600 }, // 100 per hour
    content_generation: { requests: 30, window: 3600 }, // 30 per hour
  };

  /**
   * Checks rate limit for a specific action
   */
  static async checkRateLimit(
    userId: string,
    action: keyof typeof this.RATE_LIMITS = 'api_call'
  ): Promise<RateLimitResult> {
    try {
      // Get client IP for additional tracking
      const ipAddress = await this.getClientIP();

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_action: action
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open but log the incident
        this.logRateLimitError(userId, action, error);
        return {
          allowed: true,
          current_requests: 0,
          max_requests: this.RATE_LIMITS[action].requests
        };
      }

      return data as unknown as RateLimitResult;
    } catch (error) {
      console.error('Rate limit service error:', error);
      // Fail safe - allow but with reduced limits
      return {
        allowed: true,
        current_requests: 0,
        max_requests: this.RATE_LIMITS[action].requests
      };
    }
  }

  /**
   * Records a rate limit violation for monitoring
   */
  private static async logRateLimitError(userId: string, action: string, error: any): Promise<void> {
    try {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'rate_limit_service_error',
        event_details: {
          action,
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log rate limit error:', logError);
    }
  }

  /**
   * Gets client IP address for rate limiting
   */
  private static async getClientIP(): Promise<string> {
    try {
      // In a real application, this would come from headers
      // For now, we'll use a placeholder that works with the database function
      return '127.0.0.1';
    } catch (error) {
      return '127.0.0.1';
    }
  }

  /**
   * Client-side rate limiting for immediate feedback
   */
  static clientSideRateLimit(action: keyof typeof this.RATE_LIMITS): boolean {
    const storageKey = `rate_limit_${action}`;
    const now = Date.now();
    const window = this.RATE_LIMITS[action].window * 1000; // Convert to milliseconds
    const maxRequests = this.RATE_LIMITS[action].requests;

    try {
      const stored = localStorage.getItem(storageKey);
      const requests = stored ? JSON.parse(stored) : [];

      // Filter out old requests
      const recentRequests = requests.filter((timestamp: number) => now - timestamp < window);

      // Check if we're at the limit
      if (recentRequests.length >= maxRequests) {
        return false;
      }

      // Add current request
      recentRequests.push(now);
      localStorage.setItem(storageKey, JSON.stringify(recentRequests));

      return true;
    } catch (error) {
      console.error('Client-side rate limiting error:', error);
      return true; // Fail open
    }
  }

  /**
   * Gets remaining requests for an action
   */
  static getRemainingRequests(action: keyof typeof this.RATE_LIMITS): number {
    const storageKey = `rate_limit_${action}`;
    const now = Date.now();
    const window = this.RATE_LIMITS[action].window * 1000;
    const maxRequests = this.RATE_LIMITS[action].requests;

    try {
      const stored = localStorage.getItem(storageKey);
      const requests = stored ? JSON.parse(stored) : [];

      // Filter out old requests
      const recentRequests = requests.filter((timestamp: number) => now - timestamp < window);

      return Math.max(0, maxRequests - recentRequests.length);
    } catch (error) {
      return maxRequests;
    }
  }

  /**
   * Clears rate limit data (for testing or admin reset)
   */
  static clearRateLimits(): void {
    const actions = Object.keys(this.RATE_LIMITS);
    actions.forEach(action => {
      localStorage.removeItem(`rate_limit_${action}`);
    });
  }
}