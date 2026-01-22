import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreditsBarProps {
  credits: number;
}

const CreditsBar: React.FC<CreditsBarProps> = ({ credits }) => {
  const navigate = useNavigate();

  if (credits > 0) {
    return null;
  }

  return (
    <Alert className="border-red-200 bg-red-50 mb-6">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-red-800">
          You're out of credits. Top up to continue practicing!
        </span>
        <Button
          onClick={() => navigate('/pricing')}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white ml-4"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Top Up Credits
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default CreditsBar;
