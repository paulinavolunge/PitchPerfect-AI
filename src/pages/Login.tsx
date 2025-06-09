
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, X, Mail } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  // All hooks must be called before any conditional returns
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

  // Show loading state while auth context loads - AFTER all hooks
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

  const handleEmailLogin = async (data: LoginForm) => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      // Success will be handled by the auth state change listener
      toast.success("Successfully logged in!");
      
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Failed to log in');
      
      trackEvent('login_error', {
        error_type: error.message || 'unknown_error',
        method: 'email',
        timestamp: new Date().toISOString()
      });

      toast.error("Login failed", {
        description: error.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setLoginError(error.message || 'Failed to sign in with Google');
      
      toast.error("Google login failed", {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
              {/* Google OAuth Button */}
              <Button 
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all duration-150 flex items-center justify-center gap-2 mb-4"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In with Google'}
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google icon" 
                  className="w-5 h-5"
                />
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-gray-500">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isSubmitting ? 'Signing In...' : 'Sign In with Email'}
                </Button>
              </form>

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
              <Link to="/signup" className="text-brand-green font-medium hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              New users get 1 Free Pitch Analysis!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
