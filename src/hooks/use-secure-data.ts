
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface CreditDeductionResult {
  success: boolean;
  error?: string;
  remainingCredits?: number;
}

export const useSecureData = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const deductCreditsSecurely = useCallback(async (
    featureType: string, 
    creditsToDeduct: number
  ): Promise<CreditDeductionResult> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.rpc('secure_deduct_credits_and_log_usage', {
        p_user_id: user.id,
        p_feature_used: featureType,
        p_credits_to_deduct: creditsToDeduct
      });

      if (error) {
        console.error('Credit deduction error:', error);
        return { success: false, error: error.message };
      }

      // Handle the response properly based on the function's return type
      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        
        if (result.success === true) {
          return {
            success: true,
            remainingCredits: result.remaining_credits
          };
        } else {
          return {
            success: false,
            error: result.error || 'Credit deduction failed'
          };
        }
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Unexpected error during credit deduction:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id]);

  return {
    deductCreditsSecurely,
    isProcessing
  };
};
