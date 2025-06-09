
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ArrowLeft, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import FadeTransition from '@/components/animations/FadeTransition';
import { trackEvent } from '@/utils/analytics';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    // Handle email confirmation using modern Supabase session handling
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

  const handleEmailSignup = async (data: SignupForm) => {
    setIsSubmitting(true);
    setSignupError(null);

    // Track signup attempt
    trackEvent('signup_attempt', {
      method: 'email',
      timestamp: new Date().toISOString()
    });

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        throw error;
      }

      setVerificationSent(true);
      
      // Track signup success
      trackEvent('signup_success', {
        method: 'email',
        timestamp: new Date().toISOString()
      });

      toast.success("Account created!", {
        description: "Please check your email to verify your account.",
      });

    } catch (error: any) {
      console.error('Email signup error:', error);
      setSignupError(error.message || 'Failed to create account');

      // Track signup error
      trackEvent('signup_error', {
        error_type: error.message || 'unknown_error',
        method: 'email',
        timestamp: new Date().toISOString()
      });

      toast.error("Signup failed", {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      setSignupError(error.message || 'Failed to sign up with Google');

      // Track signup error
      trackEvent('signup_error', {
        error_type: error.message || 'unknown_error',
        method: 'google',
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
          {/* Back to Home */}
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
              Sign up to get 1 Free Pitch Analysis and start mastering persuasive speech!
            </p>
          </div>

          <FadeTransition show={verificationSent} duration={300} className="mb-6">
            <Alert className="mb-6 bg-green-50 border-green-200" aria-live="assertive">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-700 font-semibold">Check your email!</AlertTitle>
              <AlertDescription className="text-green-700">
                We've sent you a verification link to complete your signup.
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
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all duration-150 flex items-center justify-center gap-2 mb-4"
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up with Google'}
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
              <form onSubmit={handleSubmit(handleEmailSignup)} className="space-y-4">
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
                    placeholder="Create a password"
                    {...register('password')}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {isSubmitting ? 'Creating Account...' : 'Sign Up with Email'}
                </Button>
              </form>

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
              New users get 1 Free Pitch Analysis upon signup!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
