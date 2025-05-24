
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/utils/analytics';

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Track email verification success
    trackEvent('email_verified', {
      timestamp: new Date().toISOString(),
      redirect_countdown: 5
    });

    // Show success toast with login link
    toast({
      title: "Email verified successfully!",
      description: "Your account has been confirmed. You can now log in.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/login?verified=true')}
        >
          Go to login
        </Button>
      ),
    });

    // Start countdown for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login?verified=true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, toast]);

  const handleLoginNow = () => {
    trackEvent('email_verified_manual_redirect', {
      timestamp: new Date().toISOString()
    });
    navigate('/login?verified=true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-md text-center p-8 rounded-lg shadow-lg border bg-gradient-to-b from-green-50 to-white">
          <div className="mb-6">
            <CheckCircle className="mx-auto text-green-500 w-16 h-16 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for confirming your email. Your account is now active and ready to use.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleLoginNow}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Sign In Now
            </Button>
            
            <p className="text-sm text-gray-500">
              Redirecting to login in {countdown} seconds...
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Welcome to PitchPerfect AI! Start practicing your sales pitches with AI-powered feedback.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmailConfirmed;
