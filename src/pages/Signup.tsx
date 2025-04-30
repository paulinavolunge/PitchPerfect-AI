
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="container max-w-md px-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Create an Account</h1>
            <p className="text-brand-dark/70 mt-2">Sign up to get started with PitchPerfect AI</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={[]}
                view="sign_up"
                theme="light"
                showLinks={true}
                redirectTo={`${window.location.origin}/dashboard`}
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
          
          <Alert className="mt-6 bg-blue-50 border-blue-100">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              To use this app, you need to provide your Supabase URL and anonymous key as environment variables.
            </AlertDescription>
          </Alert>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
