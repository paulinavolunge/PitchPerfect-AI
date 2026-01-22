import React, { useState, useCallback, useRef } from 'react';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { AccessibleProgress } from '@/components/ui/accessible-progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, AlertCircle, Upload, FileAudio, CheckCircle } from 'lucide-react';
import { FileValidator, DEFAULT_VALIDATION_CONFIG } from './FileValidator';
import { useToast } from '@/hooks/use-toast';
import { announceToScreenReader, generateUniqueId } from '@/utils/accessibility';
import { ErrorHandler } from '@/utils/errorHandler';

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

interface AccessibleCallUploaderProps {
  onCallUploaded: (callData: CallData) => void;
}

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export const AccessibleCallUploader: React.FC<AccessibleCallUploaderProps> = ({ onCallUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const fileValidator = new FileValidator(DEFAULT_VALIDATION_CONFIG);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Generate unique IDs for accessibility
  const fileInputId = useRef(generateUniqueId('file-input')).current;
  const errorId = useRef(generateUniqueId('upload-error')).current;
  const progressId = useRef(generateUniqueId('upload-progress')).current;
  
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
    announceToScreenReader('Validating file...');
    
    try {
      const validation = await fileValidator.validateFile(selectedFile);
      
      if (validation.isValid) {
        setFile(selectedFile);
        setUploadStatus('idle');
        announceToScreenReader(`File ${selectedFile.name} selected and validated successfully`);
        toast({
          title: "File selected",
          description: `${selectedFile.name} is ready for upload.`,
        });
      } else {
        const errorMessage = validation.error || 'File validation failed';
        setValidationError(errorMessage);
        setUploadStatus('error');
        setFile(null);
        announceToScreenReader(`Validation failed: ${errorMessage}`, 'assertive');
      }
    } catch (error) {
      const errorMessage = 'Validation failed';
      setValidationError(errorMessage);
      setUploadStatus('error');
      setFile(null);
      announceToScreenReader(`Validation failed: ${errorMessage}`, 'assertive');
    }
  }, [fileValidator, toast, resetState]);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    validateAndSetFile(selectedFile);
  }, [validateAndSetFile]);
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, [validateAndSetFile]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  
  const simulateUpload = useCallback(async (): Promise<CallData> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          
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
    announceToScreenReader('Starting upload...');
    
    try {
      const callData = await simulateUpload();
      setUploadStatus('success');
      announceToScreenReader('Upload completed successfully!');
      
      toast({
        title: "Upload successful",
        description: "Your call recording has been processed and analyzed.",
      });
      
      onCallUploaded(callData);
    } catch (error) {
      const errorMessage = ErrorHandler.handleAPIError(error).message;
      setUploadError(errorMessage);
      setUploadStatus('error');
      announceToScreenReader(`Upload failed: ${errorMessage}`, 'assertive');
      
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
    announceToScreenReader('Upload cancelled');
  }, [resetState]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  return (
    <section className="space-y-6" role="region" aria-labelledby="upload-heading">
      <h2 id="upload-heading" className="text-lg font-semibold">
        Upload Call Recording
      </h2>
      
      {/* Skip link for keyboard users */}
      {uploadStatus === 'idle' && (
        <a 
          href="#upload-actions" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 bg-primary text-primary-foreground px-2 py-1 rounded text-sm"
        >
          Skip to upload actions
        </a>
      )}
      
      {validationError && (
        <Alert variant="destructive" role="alert" id={errorId}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid file</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <Label htmlFor={fileInputId} className="text-base font-medium">
          Choose Audio File
        </Label>
        
        <div
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-300'
          } ${uploadStatus === 'validating' || uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-blue/50'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          role="button"
          tabIndex={0}
          aria-label={file ? `Selected file: ${file.name}` : "Drop zone for audio files. Press Enter or Space to browse files."}
          aria-describedby={validationError ? errorId : undefined}
          onClick={openFileDialog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFileDialog();
            }
          }}
        >
          {!file ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-brand-blue/10 p-4">
                  <Upload className="h-6 w-6 text-brand-blue" aria-hidden="true" />
                </div>
              </div>
              <div>
                <p className="font-medium">Drag and drop your call recording</p>
                <p className="text-sm text-brand-dark/70 mt-1">
                  or click to browse (MP3, WAV, M4A, OGG, WebM)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-brand-blue/10 p-4">
                  <FileAudio className="h-6 w-6 text-brand-blue" aria-hidden="true" />
                </div>
              </div>
              <div>
                <p className="font-medium" title={file.name}>{file.name}</p>
                <p className="text-sm text-brand-dark/70 mt-1">
                  {fileValidator.formatFileSize(file.size)}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <Input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="sr-only"
          disabled={uploadStatus === 'validating' || uploadStatus === 'uploading'}
          aria-describedby={validationError ? errorId : undefined}
        />
      </div>
      
      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="space-y-2" role="region" aria-labelledby="progress-label">
          <AccessibleProgress
            id={progressId}
            value={uploadProgress}
            label="Upload Progress"
            className="w-full"
          />
        </div>
      )}
      
      {/* Success State */}
      {uploadStatus === 'success' && (
        <Alert className="bg-green-50 border-green-200 text-green-800" role="status">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Upload Complete</AlertTitle>
          <AlertDescription>Your call recording has been successfully uploaded and processed.</AlertDescription>
        </Alert>
      )}
      
      {/* Error State */}
      {uploadStatus === 'error' && uploadError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Failed</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {/* Action Buttons */}
      <div id="upload-actions" className="flex gap-2">
        {uploadStatus === 'idle' && file && (
          <AccessibleButton
            onClick={handleUpload}
            className="flex-1"
            ariaLabel={`Upload ${file.name}`}
          >
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Upload File
          </AccessibleButton>
        )}
        
        {uploadStatus === 'error' && file && (
          <AccessibleButton
            onClick={handleRetry}
            variant="outline"
            className="flex-1"
            ariaLabel="Retry upload"
          >
            Retry
          </AccessibleButton>
        )}
        
        {(file || uploadStatus !== 'idle') && uploadStatus !== 'success' && (
          <AccessibleButton
            onClick={handleCancel}
            variant="outline"
            ariaLabel="Cancel upload"
          >
            Cancel
          </AccessibleButton>
        )}
      </div>
      
      {/* Record Audio Section */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Record from your computer</Label>
        <AccessibleButton
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          disabled={uploadStatus === 'uploading'}
          ariaLabel="Record audio - Coming soon"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Record Audio (Coming Soon)
        </AccessibleButton>
      </div>
      
      {/* File Format Information */}
      <div className="text-sm text-brand-dark/70" role="region" aria-labelledby="format-info">
        <h3 id="format-info" className="font-medium mb-2">Supported file formats:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>MP3 files (recommended)</li>
          <li>WAV files</li>
          <li>M4A files (from iPhone recordings)</li>
          <li>OGG and WebM files</li>
          <li>Maximum file size: 50MB</li>
        </ul>
      </div>
    </section>
  );
};

export default AccessibleCallUploader;
