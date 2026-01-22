
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecurityService, CreditDeductionResult, VoiceRateLimit } from '@/services/EnhancedSecurityService';
import { toast } from '@/hooks/use-toast';

export const useEnhancedSecurity = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const secureDeductCredits = useCallback(async (
    featureType: string, 
    creditsToDeduct: number
  ): Promise<CreditDeductionResult> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsProcessing(true);

    try {
      const result = await EnhancedSecurityService.secureDeductCredits(
        user.id, 
        featureType, 
        creditsToDeduct
      );

      if (!result.success) {
        toast({
          title: "Credit Deduction Failed",
          description: result.error || "Unable to process credit deduction",
          variant: "destructive",
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id]);

  const checkVoiceRateLimit = useCallback(async (): Promise<VoiceRateLimit> => {
    if (!user?.id) {
      return { success: false, blocked: false };
    }

    try {
      const result = await EnhancedSecurityService.checkVoiceRateLimit(user.id);
      
      if (result.blocked) {
        setRateLimited(true);
        
        toast({
          title: "Rate Limit Exceeded",
          description: `Too many voice processing requests. Please wait before trying again.`,
          variant: "destructive",
        });

        // Reset rate limited state after the block period
        if (result.resetTime) {
          const timeUntilReset = result.resetTime.getTime() - Date.now();
          setTimeout(() => setRateLimited(false), Math.max(timeUntilReset, 0));
        }
      }

      return result;
    } catch (error) {
      console.error('Voice rate limit check failed:', error);
      return { success: true, blocked: false }; // Fail open
    }
  }, [user?.id]);

  const validateAudioFile = useCallback((file: File) => {
    const result = EnhancedSecurityService.validateAudioFile(file);
    
    if (!result.valid) {
      toast({
        title: "File Validation Failed",
        description: result.error,
        variant: "destructive",
      });
    }

    return result;
  }, []);

  const sanitizeVoiceInput = useCallback((input: string): string | null => {
    try {
      return EnhancedSecurityService.sanitizeVoiceInput(input);
    } catch (error) {
      toast({
        title: "Input Validation Failed",
        description: error instanceof Error ? error.message : "Invalid input format",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  return {
    secureDeductCredits,
    checkVoiceRateLimit,
    validateAudioFile,
    sanitizeVoiceInput,
    isProcessing,
    rateLimited
  };
};
