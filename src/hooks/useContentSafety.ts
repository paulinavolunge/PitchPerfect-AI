
import { useState, useCallback } from 'react';
import { ContentSafetyAnalyzer, PitchContentModerator, SafetyLevel, SafetyRateLimiter, type ContentAnalysis } from '@/utils/contentSafety';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface SafetyHookResult {
  validateInput: (content: string, type?: string) => Promise<{ isValid: boolean; sanitized?: string }>;
  moderatePitch: (content: string) => Promise<{ isValid: boolean; issues: string[] }>;
  analyzeAIOutput: (output: string) => Promise<{ isSafe: boolean; filtered?: string }>;
  isLoading: boolean;
}

export const useContentSafety = (): SafetyHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const showSafetyToast = useCallback((analysis: ContentAnalysis) => {
    switch (analysis.level) {
      case SafetyLevel.BLOCKED:
        toast({
          title: "Content Blocked",
          description: "Your input contains prohibited content and cannot be processed.",
          variant: "destructive",
          duration: 5000,
        });
        break;
      case SafetyLevel.HARMFUL:
        toast({
          title: "Content Warning",
          description: "Your input may contain inappropriate content. Please revise and try again.",
          variant: "destructive",
          duration: 4000,
        });
        break;
      case SafetyLevel.SUSPICIOUS:
        toast({
          title: "Content Notice",
          description: "Your input has been automatically filtered for quality.",
          duration: 3000,
        });
        break;
    }
  }, [toast]);

  const validateInput = useCallback(async (
    content: string, 
    type: string = 'USER_MESSAGE'
  ): Promise<{ isValid: boolean; sanitized?: string }> => {
    setIsLoading(true);
    
    try {
      // Check rate limiting
      const userId = user?.id || 'anonymous';
      if (!SafetyRateLimiter.checkRateLimit(userId)) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many content validation requests. Please wait a moment.",
          variant: "destructive",
        });
        return { isValid: false };
      }

      // Analyze content
      const analysis = ContentSafetyAnalyzer.analyzeContent(
        content, 
        type as keyof typeof import('@/utils/contentSafety').INPUT_LIMITS
      );

      if (analysis.blocked) {
        showSafetyToast(analysis);
        console.warn('Content blocked:', analysis.issues);
        return { isValid: false };
      }

      if (analysis.level === SafetyLevel.SUSPICIOUS && analysis.sanitizedContent) {
        showSafetyToast(analysis);
        return { isValid: true, sanitized: analysis.sanitizedContent };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Content validation error:', error);
      toast({
        title: "Validation Error",
        description: "Unable to validate content. Please try again.",
        variant: "destructive",
      });
      return { isValid: false };
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, showSafetyToast]);

  const moderatePitch = useCallback(async (
    content: string
  ): Promise<{ isValid: boolean; issues: string[] }> => {
    setIsLoading(true);
    
    try {
      const analysis = PitchContentModerator.moderatePitch(content);
      
      if (analysis.blocked) {
        showSafetyToast(analysis);
        return { isValid: false, issues: analysis.issues };
      }

      if (analysis.level === SafetyLevel.SUSPICIOUS) {
        toast({
          title: "Pitch Review",
          description: "Your pitch has been flagged for review. Consider revising the highlighted areas.",
          duration: 4000,
        });
      }

      return { isValid: true, issues: analysis.issues };
    } catch (error) {
      console.error('Pitch moderation error:', error);
      return { isValid: false, issues: ['Moderation failed'] };
    } finally {
      setIsLoading(false);
    }
  }, [toast, showSafetyToast]);

  const analyzeAIOutput = useCallback(async (
    output: string
  ): Promise<{ isSafe: boolean; filtered?: string }> => {
    try {
      const analysis = ContentSafetyAnalyzer.analyzeAIOutput(output);
      
      if (analysis.blocked) {
        console.warn('AI output blocked:', analysis.issues);
        return { 
          isSafe: false, 
          filtered: "I apologize, but I cannot provide that response. Please try rephrasing your request." 
        };
      }

      if (analysis.sanitizedContent) {
        return { isSafe: true, filtered: analysis.sanitizedContent };
      }

      return { isSafe: true };
    } catch (error) {
      console.error('AI output analysis error:', error);
      return { 
        isSafe: false, 
        filtered: "I encountered an error processing that response. Please try again." 
      };
    }
  }, []);

  return {
    validateInput,
    moderatePitch,
    analyzeAIOutput,
    isLoading
  };
};
