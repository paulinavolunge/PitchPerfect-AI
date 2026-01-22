
import { toast } from '@/hooks/use-toast';

export interface AIError extends Error {
  code?: string;
  status?: number;
  retryable?: boolean;
  details?: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class AIErrorHandler {
  private static retryAttempts = new Map<string, number>();
  private static lastRequestTime = new Map<string, number>();
  private static rateLimitResetTime = new Map<string, number>();

  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  /**
   * Handle AI service errors with user-friendly messages
   */
  static handleError(error: AIError, context: string): void {
    console.error(`AI Error in ${context}:`, error);

    let userMessage = '';
    let showRetry = false;

    switch (error.code) {
      case 'RATE_LIMITED':
        userMessage = 'You\'re making requests too quickly. Please wait a moment and try again.';
        break;
      case 'INSUFFICIENT_CREDITS':
        userMessage = 'You don\'t have enough credits for this action. Please upgrade your plan.';
        break;
      case 'NETWORK_ERROR':
        userMessage = 'Connection issue detected. Please check your internet and try again.';
        showRetry = true;
        break;
      case 'SERVICE_UNAVAILABLE':
        userMessage = 'AI service is temporarily unavailable. We\'re working to restore it.';
        showRetry = true;
        break;
      case 'AUTHENTICATION_ERROR':
        userMessage = 'Authentication failed. Please refresh the page and try again.';
        break;
      case 'INVALID_INPUT':
        userMessage = 'Invalid input provided. Please check your request and try again.';
        break;
      case 'TIMEOUT':
        userMessage = 'Request timed out. The AI service is taking longer than expected.';
        showRetry = true;
        break;
      default:
        userMessage = 'An unexpected error occurred. Please try again or contact support if the issue persists.';
        showRetry = error.retryable !== false;
    }

    toast({
      title: "AI Service Error",
      description: userMessage,
      variant: "destructive",
      duration: showRetry ? 6000 : 4000,
    });
  }

  /**
   * Implement retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    const currentAttempts = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const aiError = this.normalizeError(error);
      
      // Don't retry non-retryable errors
      if (aiError.retryable === false || currentAttempts >= retryConfig.maxRetries) {
        this.retryAttempts.delete(operationId);
        throw aiError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, currentAttempts),
        retryConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      this.retryAttempts.set(operationId, currentAttempts + 1);

      console.log(`Retrying operation ${operationId} in ${jitteredDelay}ms (attempt ${currentAttempts + 1}/${retryConfig.maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      return this.withRetry(operation, operationId, config);
    }
  }

  /**
   * Check and enforce rate limiting
   */
  static checkRateLimit(userId: string, operation: string, limitPerMinute: number = 10): boolean {
    const now = Date.now();
    const rateLimitKey = `${userId}-${operation}`;
    const lastRequest = this.lastRequestTime.get(rateLimitKey) || 0;
    const resetTime = this.rateLimitResetTime.get(rateLimitKey) || 0;

    // Reset counter if a minute has passed
    if (now - resetTime > 60000) {
      this.rateLimitResetTime.set(rateLimitKey, now);
      this.lastRequestTime.set(rateLimitKey, 1);
      return true;
    }

    const requestCount = this.lastRequestTime.get(rateLimitKey) || 0;
    
    if (requestCount >= limitPerMinute) {
      const timeUntilReset = Math.ceil((60000 - (now - resetTime)) / 1000);
      toast({
        title: "Rate Limit Exceeded",
        description: `Too many requests. Please wait ${timeUntilReset} seconds before trying again.`,
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }

    this.lastRequestTime.set(rateLimitKey, requestCount + 1);
    return true;
  }

  /**
   * Normalize different error types into AIError
   */
  private static normalizeError(error: unknown): AIError {
    if (error instanceof Error) {
      const aiError = error as AIError;
      
      // Classify error based on message or properties
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        aiError.code = 'RATE_LIMITED';
        aiError.retryable = true;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        aiError.code = 'NETWORK_ERROR';
        aiError.retryable = true;
      } else if (error.message.includes('timeout')) {
        aiError.code = 'TIMEOUT';
        aiError.retryable = true;
      } else if (error.message.includes('401') || error.message.includes('auth')) {
        aiError.code = 'AUTHENTICATION_ERROR';
        aiError.retryable = false;
      } else if (error.message.includes('503') || error.message.includes('unavailable')) {
        aiError.code = 'SERVICE_UNAVAILABLE';
        aiError.retryable = true;
      } else if (error.message.includes('400') || error.message.includes('invalid')) {
        aiError.code = 'INVALID_INPUT';
        aiError.retryable = false;
      }

      return aiError;
    }

    return {
      name: 'AIError',
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      retryable: true,
    };
  }

  /**
   * Generate fallback response when AI service fails
   */
  static getFallbackResponse(context: string): string {
    const fallbacks = {
      'roleplay': "I apologize, but I'm having trouble generating a response right now. Could you please rephrase your message and try again?",
      'feedback': "Unable to generate detailed feedback at the moment. Please try again shortly.",
      'analysis': "Analysis service is temporarily unavailable. Your session data has been saved.",
      'voice': "Voice processing is currently unavailable. Please use text input instead.",
      'default': "I'm experiencing technical difficulties. Please try again in a moment."
    };

    return fallbacks[context as keyof typeof fallbacks] || fallbacks.default;
  }
}
