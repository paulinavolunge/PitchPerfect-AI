
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Lock, User, Loader2, AlertCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Helmet } from 'react-helmet-async';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    console.log('Signup page loaded');
    
    // Redirect if already authenticated (but not during signup process)
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, navigate, isLoading]);

  // Auto-dismiss Google error after 8 seconds
  useEffect(() => {
    if (googleError) {
      const timer = setTimeout(() => {
        setGoogleError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [googleError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/email-confirmed`
        }
      });

      if (error) {
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "Please check your email for a confirmation link to complete your signup.",
        });
      } else if (data.session) {
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
        
        // Mark as new user for onboarding
        sessionStorage.setItem('newUser', 'true');
        
        // Ensure user profile exists before navigating
        if (data.user) {
          console.log('Checking user profile...');
          
          // Give the database trigger time to execute
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if profile was created
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          if (profileError && profileError.code === 'PGRST116') {
            console.log('Profile not created by trigger, creating manually...');
            
            // Create profile manually if trigger failed
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                credits_remaining: 1,
                trial_used: false
              });
              
            if (createError) {
              console.error('Failed to create user profile:', createError);
            }
          }
        }
        
        // Add a small delay to ensure auth context is properly initialized
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    
    try {
      console.log('Starting Google OAuth signup...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log('Google OAuth response:', { data, error });

      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }

      // Note: For OAuth, the user will be redirected to Google
      // The page redirect happens automatically
      console.log('Google OAuth initiated successfully');
      
    } catch (error: any) {
      console.error('Google signup error:', error);
      setGoogleError(error.message || 'Google authentication is temporarily unavailable. Please try email signup instead.');
      
      toast({
        title: "Google Signup Issue",
        description: "Please try email signup or contact support if the problem persists.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
    // Note: Don't set loading to false here as the page will redirect
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Helmet>
        <title>Sign Up | PitchPerfect AI</title>
      </Helmet>
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-brand-blue hover:text-brand-blue-dark">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {googleError && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200 relative" aria-live="assertive">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <AlertDescription className="text-yellow-700 pr-8">
              <strong>Google Signup Issue:</strong> {googleError}
            </AlertDescription>
            <button
              onClick={() => setGoogleError(null)}
              className="absolute top-3 right-3 text-yellow-600 hover:text-yellow-800"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}

        <Card>
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <CardTitle className="text-xl mt-2">Sign Up for Free</CardTitle>
            <p className="text-gray-600">Start practicing your sales pitch today</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign Up Button */}
            <Button 
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isGoogleLoading ? 'Signing Up...' : 'Sign up with Google'}
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google icon" 
                className="w-5 h-5"
              />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="fullName">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    aria-label="Full Name"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    data-testid="email-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    aria-label="Email"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    name="password"
                    data-testid="password-input"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    aria-label="Password"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    data-testid="confirm-password-input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    aria-label="Confirm Password"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit"
                data-testid="signup-submit"
                className="w-full bg-brand-green hover:bg-brand-green/90"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Free Account'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              Already have an account? <Link to="/login" className="text-brand-blue hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
