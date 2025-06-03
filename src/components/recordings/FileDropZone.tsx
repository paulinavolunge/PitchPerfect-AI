
import React from 'react';
import { Upload, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileDropZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  formatFileSize: (bytes: number) => string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  file,
  onFileChange,
  onDragOver,
  onDrop,
  disabled = false,
  formatFileSize
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        file ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label={file ? `Selected file: ${file.name}` : "Drop zone for audio files"}
      onClick={!disabled ? handleBrowseClick : undefined}
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
          <Button 
            variant="outline"
            onClick={handleBrowseClick}
            disabled={disabled}
            aria-label="Browse for audio files"
          >
            Browse Files
          </Button>
          <input 
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
            aria-label="File input for audio recordings"
          />
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
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
