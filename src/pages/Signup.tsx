import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FadeTransition from '@/components/animations/FadeTransition';
import { trackEvent } from '@/utils/analytics'; // Assuming trackEvent is for analytics

// Removed zod schema as direct email/password signup is removed

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Kept for general submission state

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    // Handle email confirmation using modern Supabase session handling (kept for robustness)
    const handleEmailConfirmation = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setSignupError(error.message);
          toast.error("Email confirmation failed", {
            description: error.message
          });
          return;
        }

        // Check if we just came from email confirmation
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('confirmed') === 'true' || session?.user?.email_confirmed_at) {
          navigate('/email-confirmed');
        }
      } catch (error: any) {
        console.error('Error handling email confirmation:', error);
      }
    };

    handleEmailConfirmation();
  }, [user, navigate]);

  // Removed calculatePasswordStrength and passwordStrength state

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setSignupError(null);

    // Track signup attempt
    trackEvent('signup_attempt', {
      method: 'google_oauth',
      timestamp: new Date().toISOString()
    });

    try {
      // Redirect to Google OAuth provider
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`, // Redirect to dashboard after successful signup/login
        },
      });

      if (error) {
        throw error;
      }
      // The page will redirect, so no further state update here needed
      // trackEvent('signup_success_redirect_initiated'); // Analytics event
    } catch (error: any) {
      console.error('Google signup error:', error);
      setSignupError(error.message || 'Failed to sign up with Google');

      // Track signup error
      trackEvent('signup_error', {
        error_type: error.message || 'unknown_error',
        timestamp: new Date().toISOString()
      });

      toast.error("Google signup failed", {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="container max-w-md px-4">
          {/* Back to Home - moved outside card for better UX */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-brand-dark mb-6"
            onClick={handleBackToHome}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to home
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Join PitchPerfect AI</h1>
            <p className="text-brand-dark/70 mt-2">
              Sign up with Google to get 1 Free Pitch Analysis and start mastering persuasive speech!
            </p>
          </div>

          <FadeTransition show={verificationSent} duration={300} className="mb-6">
            <Alert className="mb-6 bg-green-50 border-green-200" aria-live="assertive">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-700 font-semibold">Account created!</AlertTitle>
              <AlertDescription className="text-green-700">
                You've successfully signed up. You will be redirected shortly.
              </AlertDescription>
            </Alert>
          </FadeTransition>

          <FadeTransition show={!!signupError} duration={300} className="mb-6">
            <Alert className="mb-6 bg-red-50 border-red-200" aria-live="assertive">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-700 font-semibold">Sign up error</AlertTitle>
              <AlertDescription className="text-red-700">
                {signupError}
              </AlertDescription>
            </Alert>
          </FadeTransition>

          <Card className="shadow-lg border-gray-100 overflow-hidden">
            <CardContent className="pt-6">
              {/* Google OAuth Button */}
              <Button 
                onClick={handleGoogleSignup}
                disabled={isSubmitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Signing Up with Google...' : 'Sign Up with Google'}
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google icon" 
                  className="w-5 h-5 ml-2"
                />
              </Button>

              {/* Removed the email/password form entirely */}

              {/* Trust indicator */}
              <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded mt-4">
                <Shield className="h-3 w-3 mr-1" />
                Your data is secure and encrypted.
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="text-brand-blue hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-brand-blue hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-green font-medium hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              New users get 1 Free Pitch Analysis upon Google signup!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
