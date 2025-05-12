
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuestMode } from '@/context/GuestModeContext';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn } from 'lucide-react';

interface GuestBannerProps {
  className?: string;
}

const GuestBanner: React.FC<GuestBannerProps> = ({ className = '' }) => {
  const { endGuestMode } = useGuestMode();
  const navigate = useNavigate();

  const handleSignup = () => {
    endGuestMode();
    navigate('/signup');
  };

  const handleLogin = () => {
    endGuestMode();
    navigate('/login');
  };

  return (
    <div className={`bg-brand-blue/10 border-b border-brand-blue/20 py-3 ${className}`}>
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-sm text-brand-dark mb-3 sm:mb-0 text-center sm:text-left">
          <span className="font-medium">Guest Mode:</span> Your progress won't be saved. Sign up to unlock all features.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-medium hover:bg-gray-100"
            onClick={handleLogin}
          >
            <LogIn className="h-3 w-3 mr-1.5" />
            Log In
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs font-medium bg-brand-blue hover:bg-brand-blue/90"
            onClick={handleSignup}
          >
            <UserPlus className="h-3 w-3 mr-1.5" />
            Sign Up Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestBanner;
