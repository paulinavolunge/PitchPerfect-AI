
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setIsSuccess(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Failed to send reset link",
        description: "Please try again later",
        variant: "destructive",
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
            <h1 className="text-2xl font-bold text-brand-dark">Reset Your Password</h1>
            <p className="text-brand-dark/70 mt-2">
              {isSuccess 
                ? "Check your email for the reset link" 
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {!isSuccess ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                    {!isSubmitting && <Send className="h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-4">Reset link has been sent to:</p>
                  <p className="font-medium mb-6">{email}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Please check your inbox and follow the instructions in the email.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setIsSuccess(false)}
                  >
                    Try another email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PasswordReset;
