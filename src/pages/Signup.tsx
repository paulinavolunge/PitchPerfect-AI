
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
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

// Form schema for validation
const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
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

    // Check for hash params (email confirmation)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('access_token') || hashParams.get('error_description')) {
      const errorDescription = hashParams.get('error_description');
      if (errorDescription) {
        setSignupError(decodeURIComponent(errorDescription));
        toast.error("Email confirmation failed", {
          description: decodeURIComponent(errorDescription)
        });
      } else {
        toast.success("Email verified successfully!", {
          description: "You can now sign in to your account."
        });
      }
    }
  }, [user, navigate]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    setSignupError(null);
    
    try {
      // Call Supabase auth signup
      const { data: userData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        throw error;
      }

      if (userData) {
        if (userData.user && !userData.user.email_confirmed_at) {
          setVerificationSent(true);
          toast.success("Signup successful!", {
            description: "Please check your email to verify your account."
          });
        } else {
          // In case auto-confirm is enabled
          toast.success("Account created successfully!");
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Failed to create account');
      
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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Create an Account</h1>
            <p className="text-brand-dark/70 mt-2">Sign up to get started with PitchPerfect AI</p>
          </div>

          <FadeTransition show={verificationSent} duration={300} className="mb-6">
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-700 font-semibold">Verification email sent!</AlertTitle>
              <AlertDescription className="text-green-700">
                Please check your inbox and click the link to verify your email address.
              </AlertDescription>
            </Alert>
          </FadeTransition>

          <FadeTransition show={!!signupError} duration={300} className="mb-6">
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-700 font-semibold">Sign up error</AlertTitle>
              <AlertDescription className="text-red-700">
                {signupError}
              </AlertDescription>
            </Alert>
          </FadeTransition>

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
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-brand-green hover:bg-green-600"
                    disabled={isSubmitting}
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
