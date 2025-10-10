
import React from 'react';
import { Upload, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  formatFileSize: (bytes: number) => string;
  className?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  file,
  onFileChange,
  onDragOver,
  onDrop,
  disabled = false,
  formatFileSize,
  className
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleBrowseClick();
    }
  };

  return (
    <div 
      className={cn(
        'border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        file 
          ? 'border-brand-blue bg-brand-blue/5 border-solid' 
          : 'border-gray-300 hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={
        file 
          ? `Selected file: ${file.name}, ${formatFileSize(file.size)}. Press Enter to select a different file.`
          : "Drop zone for audio files. Press Enter to browse for files."
      }
      onClick={!disabled ? handleBrowseClick : undefined}
      onKeyDown={handleKeyDown}
    >
      {!file ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-blue/10 p-3 sm:p-4">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-sm sm:text-base">Drag and drop your call recording</p>
            <p className="text-xs sm:text-sm text-brand-dark/70">
              or click to browse files
            </p>
            <p className="text-xs text-brand-dark/60">
              Supported: MP3, WAV, M4A, OGG, WebM
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={handleBrowseClick}
            disabled={disabled}
            className="mx-auto"
            aria-label="Browse for audio files"
            tabIndex={-1} // Prevent double focus since parent div is focusable
          >
            Browse Files
          </Button>
          <input 
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            className="sr-only"
            disabled={disabled}
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-brand-blue/10 p-3 sm:p-4">
              <FileAudio className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-1">
            <p 
              className="font-medium text-sm sm:text-base break-words" 
              title={file.name}
            >
              {file.name}
            </p>
            <p className="text-xs sm:text-sm text-brand-dark/70">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={handleBrowseClick}
            disabled={disabled}
            className="mx-auto"
            aria-label="Select a different file"
            tabIndex={-1}
          >
            Change File
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
