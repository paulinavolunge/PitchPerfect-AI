
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    // Check for verification success in URL
    const checkEmailConfirmation = async () => {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        // If successful confirmation, clear any errors
        setSignupError(null);
      }
    };

    // Check for email confirmation hash in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('access_token') || hashParams.get('error_description')) {
      checkEmailConfirmation();
    }
  }, [user, navigate]);

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
            <h1 className="text-2xl font-bold text-brand-dark">Create an Account</h1>
            <p className="text-brand-dark/70 mt-2">Sign up to get started with PitchPerfect AI</p>
          </div>

          {verificationSent && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertDescription className="text-green-700">
                Verification email sent! Please check your inbox and click the link to verify your email address.
              </AlertDescription>
            </Alert>
          )}

          {signupError && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-red-700">
                {signupError}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
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
                onError={(error) => {
                  setSignupError(error.message);
                  setVerificationSent(false);
                }}
                onSubmit={(formData) => {
                  // Will be called when the form is submitted
                  if (formData.email) {
                    setVerificationSent(true);
                    setSignupError(null);
                  }
                }}
              />
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-green hover:underline">
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
