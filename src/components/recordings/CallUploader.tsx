import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FileValidator, DEFAULT_VALIDATION_CONFIG } from './FileValidator';
import { FileDropZone } from './FileDropZone';
import { UploadProgress, UploadStatus } from './UploadProgress';
import { useToast } from '@/hooks/use-toast';

interface CallData {
  id: string;
  filename: string;
  size: number;
  type: string;
  date: string;
  duration: string;
  score: number;
  topStrength: string;
  topImprovement: string;
  transcript: string;
  categories: {
    clarity: number;
    confidence: number;
    handling: number;
    vocabulary: number;
  };
}

interface CallUploaderProps {
  onCallUploaded: (callData: CallData) => void;
}

export const CallUploader: React.FC<CallUploaderProps> = ({ onCallUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const fileValidator = new FileValidator(DEFAULT_VALIDATION_CONFIG);
  
  const resetState = useCallback(() => {
    setFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setValidationError(null);
    setUploadError(null);
  }, []);

  const validateAndSetFile = useCallback(async (selectedFile: File | null) => {
    if (!selectedFile) {
      resetState();
      return;
    }

    setUploadStatus('validating');
    setValidationError(null);
    
    try {
      const validation = await fileValidator.validateFile(selectedFile);
      
      if (validation.isValid) {
        setFile(selectedFile);
        setUploadStatus('idle');
        toast({
          title: "File selected",
          description: `${selectedFile.name} is ready for upload.`,
        });
      } else {
        setValidationError(validation.error || 'File validation failed');
        setUploadStatus('error');
        setFile(null);
      }
    } catch (error) {
      setValidationError('Validation failed');
      setUploadStatus('error');
      setFile(null);
    }
  }, [fileValidator, toast, resetState]);
  
  const handleFileChange = useCallback((selectedFile: File | null) => {
    validateAndSetFile(selectedFile);
  }, [validateAndSetFile]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, [validateAndSetFile]);
  
  const simulateUpload = useCallback(async (): Promise<CallData> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          
          // Simulate potential network error (10% chance)
          if (Math.random() < 0.1) {
            reject(new Error('Network error occurred during upload'));
            return;
          }
          
          // Simulate successful upload
          setTimeout(() => {
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }
            
            const callData: CallData = {
              id: Math.random().toString(36).substring(7),
              filename: file.name,
              size: file.size,
              type: file.type,
              date: new Date().toLocaleDateString(),
              duration: '8:42',
              score: 7.8,
              topStrength: 'Clear value proposition explanation',
              topImprovement: 'More time spent addressing customer concerns',
              transcript: 'Hello, this is a sample transcript from the call recording...',
              categories: {
                clarity: 8.2,
                confidence: 7.5,
                handling: 6.9,
                vocabulary: 8.1
              }
            };
            
            resolve(callData);
          }, 800);
        }
        setUploadProgress(progress);
      }, 200);
    });
  }, [file]);
  
  const handleUpload = useCallback(async () => {
    if (!file) return;
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      const callData = await simulateUpload();
      setUploadStatus('success');
      
      toast({
        title: "Upload successful",
        description: "Your call recording has been processed and analyzed.",
      });
      
      onCallUploaded(callData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(errorMessage);
      setUploadStatus('error');
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [file, simulateUpload, onCallUploaded, toast]);

  const handleRetry = useCallback(() => {
    if (file) {
      handleUpload();
    }
  }, [file, handleUpload]);

  const handleCancel = useCallback(() => {
    resetState();
  }, [resetState]);
  
  return (
    <div className="space-y-6">
      {validationError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid file</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <FileDropZone
        file={file}
        onFileChange={handleFileChange}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        disabled={uploadStatus === 'validating' || uploadStatus === 'uploading'}
        formatFileSize={fileValidator.formatFileSize}
      />
      
      {(file || uploadStatus !== 'idle') && (
        <UploadProgress
          status={uploadStatus}
          progress={uploadProgress}
          error={uploadError}
          onRetry={handleRetry}
          onCancel={handleCancel}
          onUpload={handleUpload}
        />
      )}
      
      <div>
        <p className="font-medium mb-2">Record from your computer</p>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          disabled={uploadStatus === 'uploading'}
          aria-label="Record audio - Coming soon"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Record Audio (Coming Soon)
        </Button>
      </div>
      
      <div className="text-sm text-brand-dark/70">
        <p className="mb-2">Supported file formats:</p>
        <ul className="list-disc pl-5 space-y-1" role="list">
          <li>MP3 files (recommended)</li>
          <li>WAV files</li>
          <li>M4A files (from iPhone recordings)</li>
          <li>OGG and WebM files</li>
          <li>Maximum file size: 50MB</li>
        </ul>
      </div>
    </div>
  );
};

export default CallUploader;
