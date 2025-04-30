
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
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

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
    // Listen for auth errors
    const handleAuthChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN') {
        // Clear any errors on successful sign in
        setLoginError(null);
      } else if (event === 'USER_UPDATE' && session?.error) {
        // Handle errors during login
        setLoginError(session.error.message);
        
        // Check if the error is about unverified email
        if (session.error.message.includes('Email not confirmed')) {
          setLoginError('Please verify your email address before logging in.');
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
            <h1 className="text-2xl font-bold text-brand-dark">Welcome Back</h1>
            <p className="text-brand-dark/70 mt-2">Sign in to access your account</p>
          </div>

          {verificationMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertDescription className="text-green-700">
                {verificationMessage}
              </AlertDescription>
            </Alert>
          )}

          {loginError && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-red-700">
                {loginError}
              </AlertDescription>
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
                redirectTo={`${window.location.origin}/dashboard`}
              />
              
              <div className="text-center mt-4">
                <Button 
                  variant="link" 
                  className="text-sm"
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
