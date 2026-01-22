import { useState, useEffect, useCallback } from 'react';
import { SecurityValidationService } from '@/services/SecurityValidationService';
import { EnhancedRateLimitService } from '@/services/EnhancedRateLimitService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface SecurityMetrics {
  healthStatus: 'healthy' | 'warning' | 'critical';
  rateLimits: {
    voice_processing: number;
    file_upload: number;
    api_call: number;
    content_generation: number;
  };
  recentEvents: number;
  lastSecurityCheck: Date | null;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMetrics = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Perform security health check
      const healthCheck = await SecurityValidationService.performSecurityHealthCheck();
      
      // Get rate limit status
      const rateLimits = {
        voice_processing: EnhancedRateLimitService.getRemainingRequests('voice_processing'),
        file_upload: EnhancedRateLimitService.getRemainingRequests('file_upload'),
        api_call: EnhancedRateLimitService.getRemainingRequests('api_call'),
        content_generation: EnhancedRateLimitService.getRemainingRequests('content_generation'),
      };

      // Get recent security events count
      let recentEvents = 0;
      try {
        const { data: events, error: eventsError } = await supabase
          .from('security_events')
          .select('id', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!eventsError && events) {
          recentEvents = events.length;
        }
      } catch (eventsError) {
        console.warn('Could not fetch security events count:', eventsError);
      }

      setMetrics({
        healthStatus: healthCheck.status,
        rateLimits,
        recentEvents,
        lastSecurityCheck: new Date()
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Security monitoring failed';
      setError(errorMessage);
      console.error('Security monitoring error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Auto-refresh metrics every 5 minutes
  useEffect(() => {
    refreshMetrics();
    
    const interval = setInterval(refreshMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  // Check if user has admin privileges
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const { data: isAdmin } = await supabase.rpc('is_verified_admin');
      return !!isAdmin;
    } catch (error) {
      console.error('Admin status check failed:', error);
      return false;
    }
  }, [user?.id]);

  // Log security event
  const logSecurityEvent = useCallback(async (
    eventType: string, 
    eventDetails: Record<string, any> = {}
  ) => {
    if (!user?.id) return;

    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: eventDetails,
        p_user_id: user.id
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user?.id]);

  // Validate user action
  const validateUserAction = useCallback(async (
    action: string,
    inputData?: any
  ) => {
    if (!user?.id) return { valid: false, errors: ['User not authenticated'] };

    try {
      // Log the action attempt
      await logSecurityEvent('user_action_attempt', {
        action,
        timestamp: new Date().toISOString()
      });

      // Validate based on action type
      if (inputData && typeof inputData === 'string') {
        return await SecurityValidationService.validateUserInput(inputData, user.id);
      }

      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      console.error('User action validation failed:', error);
      return { 
        valid: false, 
        errors: ['Validation service temporarily unavailable'] 
      };
    }
  }, [user?.id, logSecurityEvent]);

  // Reset rate limits (for testing/admin use)
  const resetRateLimits = useCallback(() => {
    EnhancedRateLimitService.clearRateLimits();
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    checkAdminStatus,
    logSecurityEvent,
    validateUserAction,
    resetRateLimits
  };
};