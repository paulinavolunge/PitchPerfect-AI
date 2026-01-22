
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileAudio } from 'lucide-react';

interface AudioFileUploadProps {
  onFileAccepted: (file: File) => void;
  accept?: string;
  maxSize?: number; // bytes
  className?: string;
}

export const AudioFileUpload: React.FC<AudioFileUploadProps> = ({
  onFileAccepted,
  accept = 'audio/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndProcessFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Unsupported file type. Please upload an audio file (MP3, WAV, M4A, etc.)');
      setFileInfo(null);
      return false;
    }
    
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
      setFileInfo(null);
      return false;
    }
    
    setError(null);
    setFileInfo(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    onFileAccepted(file);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        aria-label="Audio file upload area"
      >
        <FileAudio className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Drag and drop an audio file here, or click to select
          </p>
          
          <Button 
            variant="outline" 
            onClick={handleButtonClick}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Choose audio file to upload"
          >
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Choose File
          </Button>
        </div>
        
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
          aria-label="Upload audio file"
        />
      </div>
      
      {fileInfo && (
        <div className="text-xs mt-2 text-green-600" aria-live="polite" role="status">
          ✓ {fileInfo}
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription role="alert">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AudioFileUpload;
