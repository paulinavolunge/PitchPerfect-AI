
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Volume2 } from 'lucide-react';

export interface PitchFeedbackProps {
  error?: string;
  pitchDetected?: boolean;
  showNoiseWarning?: boolean;
}

export const PitchFeedback: React.FC<PitchFeedbackProps> = ({ 
  error, 
  pitchDetected,
  showNoiseWarning 
}) => {
  if (!error && pitchDetected !== false && !showNoiseWarning) {
    return null;
  }

  return (
    <div className="mt-2" aria-live="polite">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription role="alert">{error}</AlertDescription>
        </Alert>
      ) : pitchDetected === false ? (
        <Alert className="border-amber-500 bg-amber-50">
          <Volume2 className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            No pitch detected — try speaking louder or closer to the microphone.
          </AlertDescription>
        </Alert>
      ) : showNoiseWarning ? (
        <Alert className="border-blue-500 bg-blue-50">
          <Volume2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Background noise detected. For best results, find a quieter environment.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};

export default PitchFeedback;
