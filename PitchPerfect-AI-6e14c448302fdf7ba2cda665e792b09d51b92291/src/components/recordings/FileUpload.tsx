
import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileAudio, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeFilename } from '@/lib/sanitizeInput';

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  accept?: string;
  maxSize?: number; // bytes
  allowedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileAccepted,
  accept = 'audio/*',
  maxSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'],
  className,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!allowedTypes.some(type => file.type === type)) {
      return `Unsupported file type. Please upload: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${formatFileSize(maxSize)}`;
    }

    // Check if file is not empty
    if (file.size === 0) {
      return 'File is empty. Please select a valid audio file.';
    }

    return null;
  }, [allowedTypes, maxSize, formatFileSize]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setError(null);

    // Add a small delay to show validation state for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setIsValidating(false);
      // Clear the input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    setIsValidating(false);
    onFileAccepted(file);
  }, [validateFile, onFileAccepted]);

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleButtonClick();
    }
  }, [handleButtonClick]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || isValidating}
          className="flex-1 justify-center gap-2 h-auto py-3"
          aria-label={`Upload audio file. Accepted formats: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}. Maximum size: ${formatFileSize(maxSize)}`}
          onKeyDown={handleKeyDown}
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Validating...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Choose Audio File
            </>
          )}
        </Button>
        
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isValidating}
          className="sr-only"
          aria-describedby={error ? 'file-upload-error' : 'file-upload-help'}
        />
      </div>

      {/* Help text */}
      <div id="file-upload-help" className="text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1">
          <FileAudio className="h-3 w-3" aria-hidden="true" />
          <span>Supported: {allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}</span>
        </div>
        <div>Maximum size: {formatFileSize(maxSize)}</div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" id="file-upload-error" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUpload;
