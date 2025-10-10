
import React, { useState, useCallback } from 'react';
import { sanitizeVoiceInput, validateAudioFile, checkVoiceRateLimit } from '@/utils/securityUtils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SecurityValidationService } from '@/services/SecurityValidationService';
import { EnhancedRateLimitService } from '@/services/EnhancedRateLimitService';

interface SecureVoiceInputProps {
  onVoiceInput: (sanitizedInput: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const SecureVoiceInput: React.FC<SecureVoiceInputProps> = ({
  onVoiceInput,
  onError,
  disabled = false
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceInput = useCallback(async (rawInput: string) => {
    if (!user) {
      onError?.('Authentication required');
      return;
    }

    setIsProcessing(true);

    try {
      // Enhanced security validation
      const validationResult = await SecurityValidationService.validateUserInput(
        rawInput, 
        user.id, 
        'voice'
      );

      if (!validationResult.valid) {
        const errorMessage = validationResult.errors[0] || 'Voice input validation failed';
        toast.error(errorMessage);
        onError?.(errorMessage);
        return;
      }

      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warning => toast.error(warning));
      }

      // Enhanced rate limiting check
      const rateLimitResult = await EnhancedRateLimitService.checkRateLimit(user.id, 'voice_processing');
      if (!rateLimitResult.allowed) {
        const errorMessage = 'Voice processing rate limit exceeded. Please try again later.';
        toast.error(errorMessage);
        onError?.(errorMessage);
        return;
      }

      // Use sanitized content from validation
      const sanitizedInput = validationResult.sanitizedData || rawInput;
      
      // Log enhanced security event
      await supabase.rpc('log_security_event', {
        p_event_type: 'voice_input_processed_secure',
        p_event_details: {
          input_length: sanitizedInput.length,
          original_length: rawInput.length,
          sanitized: validationResult.was_sanitized,
          safety_warnings: validationResult.warnings.length,
          rate_limit_remaining: rateLimitResult.current_requests
        }
      });

      onVoiceInput(sanitizedInput);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice processing failed';
      console.error('Secure voice input error:', error);
      onError?.(errorMessage);
      toast.error(errorMessage);

      // Log security event for failed processing
      await supabase.rpc('log_security_event', {
        p_event_type: 'voice_input_failed_secure',
        p_event_details: {
          error: errorMessage,
          input_length: rawInput?.length || 0
        }
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, onVoiceInput, onError]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      onError?.('Authentication required');
      return;
    }

    try {
      // Enhanced file validation
      const validationResult = await SecurityValidationService.validateFileUpload(
        file.name,
        file.size,
        file.type,
        user.id
      );

      if (!validationResult.valid) {
        const errorMessage = validationResult.errors[0] || 'File validation failed';
        toast.error(errorMessage);
        onError?.(errorMessage);
        return;
      }

      // Show warnings if any
      if (validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warning => toast.error(warning));
      }

      // Log enhanced file upload security event
      await supabase.rpc('log_security_event', {
        p_event_type: 'audio_file_uploaded_secure',
        p_event_details: {
          file_size: file.size,
          file_type: file.type,
          original_name: file.name,
          sanitized_name: validationResult.sanitizedData?.sanitized_name,
          security_warnings: validationResult.warnings.length
        }
      });

      toast.success('Audio file validated and ready for processing');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File validation failed';
      console.error('File validation error:', error);
      onError?.(errorMessage);
      toast.error(errorMessage);

      // Log security event for failed validation
      await supabase.rpc('log_security_event', {
        p_event_type: 'file_validation_failed_secure',
        p_event_details: {
          error: errorMessage,
          file_name: file?.name || 'unknown'
        }
      });
    }
  }, [user, onError]);

  return (
    <div className="secure-voice-input">
      {/* Voice input implementation would go here */}
      <p className="text-sm text-gray-600">
        Secure voice input component with enhanced validation and rate limiting
      </p>
      {isProcessing && (
        <div className="text-sm text-blue-600">Processing voice input securely...</div>
      )}
    </div>
  );
};

export default SecureVoiceInput;
