
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeVoiceInput, checkVoiceRateLimit } from '@/utils/securityUtils';
import { toast } from 'sonner';

interface VoiceProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useSecureVoiceProcessing = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const processVoiceInput = useCallback(async (
    rawInput: string,
    processingType: 'transcription' | 'analysis' | 'feedback'
  ): Promise<VoiceProcessingResult> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    setIsProcessing(true);

    try {
      // Check rate limiting
      const rateLimitOk = await checkVoiceRateLimit(user.id, supabase);
      if (!rateLimitOk) {
        setRateLimited(true);
        setTimeout(() => setRateLimited(false), 60000); // Reset after 1 minute
        return { success: false, error: 'Rate limit exceeded. Please wait before trying again.' };
      }

      // Sanitize input
      const sanitizedInput = sanitizeVoiceInput(rawInput);

      // Process the sanitized input (implement actual processing logic here)
      const result = {
        processedText: sanitizedInput,
        timestamp: new Date().toISOString(),
        type: processingType
      };

      return { success: true, data: result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';

      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  const checkSecurityStatus = useCallback(async () => {
    if (!user) return { rateLimited: false, blocked: false };

    try {
      const { data, error } = await supabase
        .from('voice_rate_limits')
        .select('blocked_until, request_count')
        .eq('user_id', user.id)
        .gte('window_start', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Security status check error:', error);
        return { rateLimited: false, blocked: false };
      }

      const blocked = data?.blocked_until && new Date(data.blocked_until) > new Date();
      const rateLimited = data?.request_count >= 10;

      return { rateLimited: !!rateLimited, blocked: !!blocked };
    } catch (error) {
      console.error('Security status check failed:', error);
      return { rateLimited: false, blocked: false };
    }
  }, [user]);

  return {
    processVoiceInput,
    checkSecurityStatus,
    isProcessing,
    rateLimited
  };
};
