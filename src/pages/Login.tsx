
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
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
            <h1 className="text-2xl font-bold text-brand-dark">Welcome Back</h1>
            <p className="text-brand-dark/70 mt-2">Sign in to access your account</p>
          </div>

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
