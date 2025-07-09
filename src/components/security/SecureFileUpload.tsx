import React, { useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecurityService } from '@/services/EnhancedSecurityService';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecureFileUploadProps {
  onFileUpload: (file: File, sanitizedName?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onFileUpload,
  onError,
  disabled = false,
  accept = "audio/*",
  maxSizeMB = 25
}) => {
  const { user } = useAuth();
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setValidationStatus('validating');

    try {
      // Step 1: Client-side validation
      const clientValidation = EnhancedSecurityService.validateAudioFile(file);
      if (!clientValidation.valid) {
        setValidationStatus('error');
        const errorMessage = clientValidation.error || 'File validation failed';
        onError?.(errorMessage);
        toast({
          title: "File Validation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Step 2: Server-side validation (enhanced security)
      const serverValidation = await EnhancedSecurityService.validateFileUploadSecure(
        file.name,
        file.size,
        file.type,
        user?.id
      );

      if (!serverValidation.valid) {
        setValidationStatus('error');
        const errorMessage = serverValidation.error || 'Server validation failed';
        onError?.(errorMessage);
        toast({
          title: "Security Validation Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // File passed all validation checks
      setValidationStatus('success');
      toast({
        title: "File Validated",
        description: "File passed all security checks and is ready for upload",
        variant: "default",
      });

      // Call the upload handler with the validated file
      onFileUpload(file);

    } catch (error) {
      setValidationStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      console.error('File validation error:', error);
      onError?.(errorMessage);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
      // Reset the input
      event.target.value = '';
    }
  }, [user?.id, onFileUpload, onError]);

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (validationStatus) {
      case 'validating':
        return 'Validating file security...';
      case 'success':
        return 'File validated successfully';
      case 'error':
        return 'Validation failed';
      default:
        return 'Choose audio file';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={disabled || isValidating}
          className="relative overflow-hidden"
          asChild
        >
          <label className="cursor-pointer">
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled || isValidating}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </label>
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Maximum file size: {maxSizeMB}MB</p>
        <p>• Supported formats: WAV, MP3, MPEG, M4A, AAC</p>
        <p>• All files undergo security validation</p>
      </div>
      
      {validationStatus === 'error' && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          File validation failed. Please check the file format and size requirements.
        </div>
      )}
      
      {validationStatus === 'success' && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
          File validated successfully and ready for processing.
        </div>
      )}
    </div>
  );
};

export default SecureFileUpload;