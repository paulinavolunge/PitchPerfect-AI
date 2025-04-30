
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery token in the URL
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      setIsValidToken(false);
      toast({
        title: "Invalid or expired link",
        description: "Please request a new password reset",
        variant: "destructive",
      });
    }
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
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
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
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
      
      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 2000);
      
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Failed to update password",
        description: "Please try again or request a new reset link",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

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
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {password && (
                      <div className="mt-1 text-xs flex items-center">
                        {validatePassword(password) ? (
                          <Check className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        Must be at least 6 characters
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
