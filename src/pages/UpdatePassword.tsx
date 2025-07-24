
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';
import { passwordSchema } from '@/utils/formValidation';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTokenValidation = async () => {
      // Supabase recovery links use URL fragments (hash) or come pre-authenticated
      // First check if we already have a session (user came from recovery email)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidToken(true);
        return;
      }

      // Check for token in URL fragments (hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // Also check URL search params as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || urlParams.get('code');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        // Supabase handles this automatically, just set as valid
        setIsValidToken(true);
        return;
      }
      
      if (token) {
        try {
          // Try to exchange the token for a session
          const { error } = await supabase.auth.exchangeCodeForSession(token);
          
          if (error) {
            throw error;
          }
          
          setIsValidToken(true);
          return;
        } catch (error) {
          console.error("Error validating token:", error);
        }
      }
      
      // If no valid session or token found
      setIsValidToken(false);
      toast({
        title: "Invalid or expired link",
        description: "Please request a new password reset",
        variant: "destructive",
      });
    };

    handleTokenValidation();
  }, [toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password using the schema
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      toast({
        title: "Password requirements not met",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated successfully!",
        description: "Redirecting to login page...",
      });
      
      // Redirect to login after showing success message
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (error: any) {
      console.error("Error updating password:", error);
      let errorMessage = "Please try again or request a new reset link";
      
      if (error?.message?.includes('Password should be at least')) {
        errorMessage = error.message;
      } else if (error?.status === 422) {
        errorMessage = "Password doesn't meet security requirements. Please use a stronger password.";
      }
      
      toast({
        title: "Failed to update password",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePassword = (password: string) => {
    return passwordSchema.safeParse(password).success;
  };

  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const getPasswordRequirements = (password: string) => {
    return [
      { text: "At least 6 characters", met: password.length >= 6 },
      { text: "One uppercase letter", met: /[A-Z]/.test(password) },
      { text: "One lowercase letter", met: /[a-z]/.test(password) },
      { text: "One number", met: /[0-9]/.test(password) },
    ];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="container max-w-md px-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-dark">Set New Password</h1>
            <p className="text-brand-dark/70 mt-2">
              Create a new secure password for your account
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isValidToken ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                      New Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {password && (
                      <div className="mt-2 space-y-1">
                        {getPasswordRequirements(password).map((req, index) => (
                          <div key={index} className="text-xs flex items-center">
                            {req.met ? (
                              <Check className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <X className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            <span className={req.met ? "text-green-600" : "text-red-600"}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                      Confirm New Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {confirmPassword && (
                      <div className="mt-1 text-xs flex items-center">
                        {passwordsMatch ? (
                          <Check className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        Passwords {passwordsMatch ? 'match' : "don't match"}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting || !validatePassword(password) || !passwordsMatch}
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-4">Invalid or expired password reset link.</p>
                  <Button onClick={() => navigate('/password-reset')}>
                    Request New Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UpdatePassword;
