
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Mic, AlertCircle, FileAudio, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface CallUploaderProps {
  onCallUploaded: (callData: any) => void;
}

const CallUploader: React.FC<CallUploaderProps> = ({ onCallUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is an audio file
      if (!selectedFile.type.startsWith('audio/')) {
        setUploadStatus('error');
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus('idle');
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Check if file is an audio file
      if (!droppedFile.type.startsWith('audio/')) {
        setUploadStatus('error');
        return;
      }
      
      setFile(droppedFile);
      setUploadStatus('idle');
    }
  };
  
  const handleUpload = () => {
    if (!file) return;
    
    setUploadStatus('uploading');
    
    // Simulate file upload with progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simulate successful upload
        setTimeout(() => {
          setUploadStatus('success');
          
          // Generate mock data for the uploaded call
          const callData = {
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
          
          onCallUploaded(callData);
        }, 800);
      }
      setUploadProgress(progress);
    }, 200);
  };
  
  return (
    <div className="space-y-6">
      {uploadStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid file</AlertTitle>
          <AlertDescription>
            Please upload an audio file (MP3, WAV, etc.)
          </AlertDescription>
        </Alert>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          file ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!file ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-brand-blue/10 p-4">
                <Upload className="h-6 w-6 text-brand-blue" />
              </div>
            </div>
            <div>
              <p className="font-medium">Drag and drop your call recording</p>
              <p className="text-sm text-brand-dark/70 mt-1">
                or click to browse (MP3, WAV, M4A)
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-brand-blue/10 p-4">
                <FileAudio className="h-6 w-6 text-brand-blue" />
              </div>
            </div>
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-brand-dark/70 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            
            {uploadStatus === 'uploading' ? (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-brand-dark/70">Uploading... {uploadProgress.toFixed(0)}%</p>
              </div>
            ) : uploadStatus === 'success' ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Upload Complete</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                >
                  Upload File
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setUploadStatus('idle');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div>
        <p className="font-medium mb-2">Record from your computer</p>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Mic className="h-4 w-4" />
          Record Audio (Coming Soon)
        </Button>
      </div>
      
      <div className="text-sm text-brand-dark/70">
        <p className="mb-2">Supported file formats:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>MP3 files (recommended)</li>
          <li>WAV files</li>
          <li>M4A files (from iPhone recordings)</li>
          <li>Maximum file size: 100MB</li>
        </ul>
      </div>
    </div>
  );
};

export default CallUploader;
