
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ServerSideValidationService } from '@/services/ServerSideValidationService';
import { toast } from '@/hooks/use-toast';

interface FileValidationHook {
  validateFile: (file: File) => Promise<boolean>;
  isValidating: boolean;
  lastValidationResult: any | null;
}

export const useEnhancedFileValidation = (): FileValidationHook => {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState(null);

  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    if (!file) {
      toast({
        title: "Validation Error",
        description: "No file provided for validation",
        variant: "destructive",
      });
      return false;
    }

    setIsValidating(true);

    try {
      // First, client-side basic validation
      const clientValidation = {
        valid: file.size <= 50 * 1024 * 1024 && // 50MB
               ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/aac'].includes(file.type)
      };

      if (!clientValidation.valid) {
        toast({
          title: "File Validation Failed",
          description: "File size too large or invalid type",
          variant: "destructive",
        });
        return false;
      }

      // Server-side validation
      const serverValidation = await ServerSideValidationService.validateFileUpload(
        file.name,
        file.size,
        file.type,
        user?.id
      );

      setLastValidationResult(serverValidation);

      if (!serverValidation.valid) {
        toast({
          title: "Server Validation Failed",
          description: serverValidation.error || "File validation failed on server",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      const sanitizedError = ServerSideValidationService.sanitizeErrorMessage(error);
      toast({
        title: "Validation Error",
        description: sanitizedError,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [user?.id]);

  return {
    validateFile,
    isValidating,
    lastValidationResult
  };
};
