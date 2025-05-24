
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Show loading state while auth context loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-brand-dark">Loading...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    // Check for verification message in URL params
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('verified') === 'true') {
      setVerificationMessage("Email verified successfully! You can now log in.");
    }
  }, [user, navigate, location]);

  useEffect(() => {
    // Listen for auth state changes with proper cleanup
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // Clear any errors on successful sign in
          setLoginError(null);
          
          // Track successful login
          trackEvent('login_success', {
            method: 'email',
            timestamp: new Date().toISOString(),
            user_id: session?.user?.id
          });
          
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear any errors
          setLoginError(null);
        }
        // Note: Auth errors are typically handled by the Auth UI component itself
        // or can be caught during the actual auth operations
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Auto-dismiss alerts after 6 seconds
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        setLoginError(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [loginError]);

  useEffect(() => {
    if (verificationMessage) {
      const timer = setTimeout(() => {
        setVerificationMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [verificationMessage]);

  const authAppearance = {
    theme: ThemeSupa,
    style: {
      button: {
        borderRadius: '0.375rem',
        backgroundColor: 'rgb(22 163 74)',
        color: 'white',
      },
      anchor: {
        color: 'rgb(22 163 74)',
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="container max-w-md px-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Welcome Back to PitchPerfect AI</h1>
            <p className="text-brand-dark/70 mt-2">Sign in to access your account</p>
          </div>

          {verificationMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200 relative" aria-live="assertive">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertDescription className="text-green-700 pr-8">
                {verificationMessage}
              </AlertDescription>
              <button
                onClick={() => setVerificationMessage(null)}
                className="absolute top-3 right-3 text-green-600 hover:text-green-800"
                aria-label="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

          {loginError && (
            <Alert className="mb-6 bg-red-50 border-red-200 relative" aria-live="assertive">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-red-700 pr-8">
                {loginError}
              </AlertDescription>
              <button
                onClick={() => setLoginError(null)}
                className="absolute top-3 right-3 text-red-600 hover:text-red-800"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <Auth
                supabaseClient={supabase}
                appearance={authAppearance}
                providers={[]}
                view="sign_in"
                showLinks={true}
                onlyThirdPartyProviders={false}
                redirectTo={`${window.location.origin}/dashboard`}
              />
              
              <div className="text-center mt-4">
                <Button 
                  variant="link" 
                  className="text-sm w-full"
                  onClick={() => navigate('/password-reset')}
                >
                  Forgot your password?
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-green hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
