
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface TranscriptAreaProps {
  transcript?: string | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const TranscriptArea: React.FC<TranscriptAreaProps> = ({ 
  transcript, 
  loading, 
  error, 
  onRetry 
}) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    if (transcript) {
      try {
        await navigator.clipboard.writeText(transcript);
        toast({
          title: "Copied!",
          description: "Transcript copied to clipboard",
          variant: "default",
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Unable to copy transcript to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-sm text-gray-700">Transcript</h3>
          {transcript && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-1"
              aria-label="Copy transcript to clipboard"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              Copy
            </Button>
          )}
        </div>
        
        <div aria-label="Transcript Section" className="min-h-[80px]">
          {loading ? (
            <div className="flex items-center gap-2" role="status" aria-live="polite">
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary" aria-hidden="true" />
              <span className="text-sm text-gray-600">Transcribing your speech...</span>
            </div>
          ) : error ? (
            <div className="space-y-2">
              <div className="text-destructive text-sm flex items-start gap-2" role="alert">
                <span className="flex-1">{error}</span>
              </div>
              {onRetry && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onRetry}
                  className="flex items-center gap-1"
                  aria-label="Retry transcription"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Retry
                </Button>
              )}
            </div>
          ) : (
            <textarea
              className="w-full min-h-[60px] resize-none rounded border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Your transcript will appear here as you speak..."
              value={transcript || ''}
              readOnly
              aria-label="Transcript of your pitch"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptArea;
