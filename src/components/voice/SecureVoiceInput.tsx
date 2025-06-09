
import React, { useState, useCallback } from 'react';
import { sanitizeVoiceInput, validateAudioFile, checkVoiceRateLimit } from '@/utils/securityUtils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      // Check rate limiting
      const rateLimitOk = await checkVoiceRateLimit(user.id, supabase);
      if (!rateLimitOk) {
        toast.error('Rate limit exceeded. Please wait before trying again.');
        onError?.('Rate limit exceeded');
        return;
      }

      // Sanitize and validate input
      const sanitizedInput = sanitizeVoiceInput(rawInput);
      
      // Log security event for monitoring
      await supabase.rpc('log_security_event', {
        p_event_type: 'voice_input_processed',
        p_event_details: {
          input_length: sanitizedInput.length,
          original_length: rawInput.length,
          sanitized: sanitizedInput !== rawInput
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
        p_event_type: 'voice_input_failed',
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
      // Validate file before processing
      validateAudioFile(file);
      
      // Log file upload security event
      await supabase.rpc('log_security_event', {
        p_event_type: 'audio_file_uploaded',
        p_event_details: {
          file_size: file.size,
          file_type: file.type,
          file_name: file.name
        }
      });

      // Process file (implement actual audio processing here)
      toast.success('Audio file validated and ready for processing');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File validation failed';
      console.error('File validation error:', error);
      onError?.(errorMessage);
      toast.error(errorMessage);

      // Log security event for failed validation
      await supabase.rpc('log_security_event', {
        p_event_type: 'file_validation_failed',
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
