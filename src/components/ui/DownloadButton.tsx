
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeFilename } from '@/lib/sanitizeInput';

interface DownloadButtonProps {
  blob: Blob | null;
  filename: string;
  onDownload?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  blob, 
  filename, 
  onDownload,
  variant = 'default',
  size = 'default',
  className
}) => {
  const { toast } = useToast();

  const handleDownload = () => {
    if (!blob) {
      toast({
        title: "Download failed",
        description: "No file available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const safeName = sanitizeFilename(filename);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast({
        title: "Download started",
        description: `${safeName} is being downloaded`,
        variant: "default",
      });
      
      onDownload?.();
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={!blob}
      variant={variant}
      size={size}
      className={className}
      aria-label={`Download ${filename}`}
    >
      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
      Download
    </Button>
  );
};

export default DownloadButton;
