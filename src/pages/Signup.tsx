
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import FadeTransition from '@/components/animations/FadeTransition';
import { trackEvent } from '@/utils/analytics';

// Form schema for validation - using exactly the standard email validation pattern
const signupSchema = z.object({
  email: z.string().regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    { message: "Invalid email address" }
  ),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationSent, setVerificationSent] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    }
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

  // Calculate password strength for better UX
  const calculatePasswordStrength = (password: string): { score: number; feedback: string } => {
    let score = 0;
    let feedback = "Very weak";
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score >= 4) feedback = "Strong";
    else if (score >= 3) feedback = "Good";
    else if (score >= 2) feedback = "Fair";
    else if (score >= 1) feedback = "Weak";
    
    return { score, feedback };
  };

  const currentPassword = form.watch("password");
  const passwordStrength = currentPassword ? calculatePasswordStrength(currentPassword) : null;

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    setSignupError(null);
    
    // Track signup attempt
    trackEvent('signup_attempt', {
      email_domain: data.email.split('@')[1],
      timestamp: new Date().toISOString()
    });
    
    try {
      // Call Supabase auth signup
      const { data: userData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?confirmed=true`,
        }
      });

      if (error) {
        throw error;
      }

      if (userData) {
        if (userData.user && !userData.user.email_confirmed_at) {
          setVerificationSent(true);
          
          // Track successful signup
          trackEvent('signup_success', {
            email_domain: data.email.split('@')[1],
            verification_required: true,
            timestamp: new Date().toISOString()
          });

          toast.success("Account created successfully!", {
            description: "Please check your email to verify your account.",
            action: {
              label: "Go to login",
              onClick: () => navigate('/login')
            }
          });
        } else {
          // In case auto-confirm is enabled
          trackEvent('signup_success', {
            email_domain: data.email.split('@')[1],
            verification_required: false,
            timestamp: new Date().toISOString()
          });
          
          toast.success("Account created successfully!");
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Failed to create account');
      
      // Track signup error
      trackEvent('signup_error', {
        error_type: error.message || 'unknown_error',
        timestamp: new Date().toISOString()
      });
      
      const errorMsg = error.message.toLowerCase();
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
          description: error.message
        });
      }
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
            <h1 className="text-2xl font-bold text-brand-dark">Create an Account</h1>
            <p className="text-brand-dark/70 mt-2">
              Sign up to start mastering persuasive speech with AI roleplay.
            </p>
          </div>

          <FadeTransition show={verificationSent} duration={300} className="mb-6">
            <Alert className="mb-6 bg-green-50 border-green-200" aria-live="assertive">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-700 font-semibold">Verification email sent!</AlertTitle>
              <AlertDescription className="text-green-700">
                Please check your inbox and click the link to verify your email address.
                <Link to="/login" className="block mt-2 text-green-600 hover:underline font-medium">
                  Go to login page →
                </Link>
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            autoComplete="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            autoComplete="new-password"
                            {...field} 
                          />
                        </FormControl>
                        {passwordStrength && currentPassword && (
                          <div className="text-xs mt-1">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1">
                                <div 
                                  className={`h-1 rounded-full transition-all ${
                                    passwordStrength.score >= 4 ? 'bg-green-500' :
                                    passwordStrength.score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                />
                              </div>
                              <span className={`font-medium ${
                                passwordStrength.score >= 4 ? 'text-green-600' :
                                passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {passwordStrength.feedback}
                              </span>
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your password" 
                            autoComplete="new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Trust indicator */}
                  <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <Shield className="h-3 w-3 mr-1" />
                    Your data is secure and encrypted.
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow-md transition-all duration-150"
                    disabled={isSubmitting}
                    style={{ opacity: 1 }}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>
              </Form>
              
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
