
import { toast } from '@/hooks/use-toast';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

export class ErrorHandler {
  static handleAPIError(error: any): APIError {
    let message = 'An unexpected error occurred';
    let status: number | undefined;
    let code: string | undefined;

    if (error.response) {
      // HTTP error response
      status = error.response.status;
      message = error.response.data?.message || `Error ${status}`;
      code = error.response.data?.code;
      
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Authentication required. Please log in.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        case 503:
          message = 'Service temporarily unavailable. Please try again later.';
          break;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection.';
    } else if (error.message) {
      // JavaScript error
      message = error.message;
    }

    return { message, status, code };
  }

  static showErrorToast(error: any, customMessage?: string) {
    const apiError = this.handleAPIError(error);
    
    toast({
      title: "Error",
      description: customMessage || apiError.message,
      variant: "destructive",
    });
  }

  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError;
  }

  static logError(error: any, context?: string) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, you would send this to an error tracking service
    console.error('Application Error:', errorInfo);
  }
}

export const handleAPIError = ErrorHandler.handleAPIError;
export const showErrorToast = ErrorHandler.showErrorToast;
export const withRetry = ErrorHandler.withRetry;
export const logError = ErrorHandler.logError;
