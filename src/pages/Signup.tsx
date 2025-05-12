
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    const checkEmailConfirmation = async () => {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        setSignupError(null);
      }
    };

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('access_token') || hashParams.get('error_description')) {
      checkEmailConfirmation();
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleAuthChange = (event: string, session: any) => {
      if (event === 'USER_CREATED') {
        setVerificationSent(true);
        setSignupError(null);
        setIsSubmitting(false);
        toast.success("Account created successfully!", {
          description: "Please check your email to verify your account."
        });
      } else if (event === 'SIGNUP' && session?.error) {
        setSignupError(session.error.message);
        setVerificationSent(false);
        setIsSubmitting(false);

        const errorMsg = session.error.message.toLowerCase();
        if (errorMsg.includes('password')) {
          toast.error("Password error", {
            description: "Password should be at least 8 characters with numbers and special characters."
          });
        } else if (errorMsg.includes('email')) {
          toast.error("Invalid email", {
            description: "Please enter a valid email address."
          });
        } else {
          toast.error("Signup failed", {
            description: session.error.message
          });
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
        fontWeight: '500',
        padding: '0.625rem 1rem',
        transition: 'all 0.2s ease-in-out',
      },
      anchor: {
        color: 'rgb(22 163 74)',
        fontWeight: '500',
      },
      input: {
        borderRadius: '0.375rem',
        padding: '0.625rem 1rem',
        borderWidth: '1px',
        transition: 'all 0.2s ease-in-out',
      },
      message: {
        color: 'rgb(220 38 38)',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
        fontWeight: '400',
      },
      container: {
        gap: '1rem',
      },
      label: {
        fontWeight: '500',
        marginBottom: '0.25rem',
      }
    },
    variables: {
      default: {
        colors: {
          inputBorderFocus: 'rgb(22 163 74)',
          inputBorderHover: 'rgb(22 163 74)',
          inputBorderInvalid: 'rgb(220 38 38)',
          brand: 'rgb(22 163 74)',
          brandAccent: 'rgb(21 128 61)',
        },
      },
    },
  };

  const handleBeforeSignup = () => {
    setIsSubmitting(true);
  };
  
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="container max-w-md px-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Create an Account</h1>
            <p className="text-brand-dark/70 mt-2">Sign up to get started with PitchPerfect AI</p>
          </div>

          {verificationSent && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-700 font-semibold">Verification email sent!</AlertTitle>
              <AlertDescription className="text-green-700">
                Please check your inbox and click the link to verify your email address.
              </AlertDescription>
            </Alert>
          )}

          {signupError && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-700 font-semibold">Sign up error</AlertTitle>
              <AlertDescription className="text-red-700">
                {signupError}
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-lg border-gray-100">
            <CardHeader className="bg-white rounded-t-lg px-6 py-4 border-b border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-brand-dark -ml-2 mb-2"
                onClick={handleBackToHome}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to home
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleBeforeSignup}>
                <Auth
                  supabaseClient={supabase}
                  appearance={authAppearance}
                  providers={[]}
                  view="sign_up"
                  showLinks={true}
                  redirectTo={`${window.location.origin}/dashboard`}
                  onlyThirdPartyProviders={false}
                  magicLink={false}
                  queryParams={{
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                  }}
                />
              </form>
              
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
