
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDownloadProps {
  blob: Blob | null;
  filename: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FileDownload: React.FC<FileDownloadProps> = ({
  blob,
  filename,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  children
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const sanitizeFilename = useCallback((name: string): string => {
    // Remove or replace invalid characters for filenames
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
  }, []);

  const getContentType = useCallback((blob: Blob): string => {
    // Ensure proper content-type based on blob type or filename extension
    if (blob.type) {
      return blob.type;
    }
    
    const extension = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'webm': 'audio/webm'
    };
    
    return contentTypeMap[extension || ''] || 'application/octet-stream';
  }, [filename]);

  const handleDownload = useCallback(async () => {
    if (!blob) return;

    setIsDownloading(true);

    try {
      const sanitizedFilename = sanitizeFilename(filename);
      const contentType = getContentType(blob);
      
      // Create a new blob with proper content type if needed
      const downloadBlob = blob.type ? blob : new Blob([blob], { type: contentType });
      
      const url = URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = sanitizedFilename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [blob, filename, sanitizeFilename, getContentType]);

  const formatFileSize = useCallback((size: number): string => {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const isDisabled = disabled || !blob || isDownloading;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDisabled}
      className={cn('gap-2', className)}
      aria-label={
        blob 
          ? `Download ${filename} (${formatFileSize(blob.size)})${isDownloading ? ' - downloading...' : ''}`
          : 'No file available to download'
      }
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Downloading...
        </>
      ) : (
        <>
          {children || (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download
            </>
          )}
        </>
      )}
    </Button>
  );
};

export default FileDownload;
