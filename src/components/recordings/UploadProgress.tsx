
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

interface UploadProgressProps {
  status: UploadStatus;
  progress: number;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  onUpload?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  status,
  progress,
  error,
  onRetry,
  onCancel,
  onUpload
}) => {
  if (status === 'idle') {
    return (
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={onUpload}
          aria-label="Upload selected file"
        >
          Upload File
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          aria-label="Cancel file selection"
        >
          Cancel
        </Button>
      </div>
    );
  }

  if (status === 'validating') {
    return (
      <div className="flex items-center justify-center gap-2 text-blue-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Validating file...</span>
      </div>
    );
  }

  if (status === 'uploading') {
    return (
      <div className="space-y-2">
        <Progress 
          value={progress} 
          aria-label={`Upload progress: ${progress.toFixed(0)}%`}
        />
        <p className="text-sm text-brand-dark/70 text-center">
          Uploading... {progress.toFixed(0)}%
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600">
        <Check className="h-4 w-4" aria-hidden="true" />
        <span>Upload Complete</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>Upload Failed</span>
        </div>
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex-1"
            aria-label="Retry upload"
          >
            Retry
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            aria-label="Cancel upload"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
