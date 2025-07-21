
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addToWaitlist } from '@/utils/demoUtils';
import { sendSessionToCRM, sendImmediateConfirmation, CRMProvider, getWebhookUrl } from '@/utils/webhookUtils';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionData?: any;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ open, onOpenChange, sessionData }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Default to "zapier" but check other providers if zapier is not configured
  const determineCRMProvider = (): CRMProvider => {
    const providers: CRMProvider[] = ["zapier", "hubspot", "salesforce", "freshsales", "custom"];
    
    for (const provider of providers) {
      if (getWebhookUrl(provider)) {
        return provider;
      }
    }
    
    return "zapier"; // Default if none configured
  };
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send immediate confirmation email
      await sendImmediateConfirmation(trimmedEmail);
      
      // Send data to waitlist
      await addToWaitlist(trimmedEmail);
      
      // Send session data to CRM immediately with the email
      if (sessionData) {
        const enrichedData = {
          ...sessionData,
          email: trimmedEmail,
          requestType: "pdf_recap"
        };
        
        // Determine which CRM provider to use
        const provider = determineCRMProvider();
        
        // Fire webhook without waiting
        sendSessionToCRM(enrichedData, provider).catch(error => {
          console.error(`CRM ${provider} webhook error:`, error);
        });
      }
      
      // Show success state
      setIsSuccess(true);
      
      // Also show a toast for extra confirmation
      toast({
        title: "Success!",
        description: "Your pitch recap has been sent to your email.",
      });
      
    } catch (error) {
      console.error('Error processing request:', error);
      setError('There was a problem sending your recap. Please try again.');
      toast({
        title: "Error",
        description: "Failed to send your recap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    // Reset state when closing
    setIsSuccess(false);
    setEmail('');
    setError(null);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Want a PDF recap of your pitch?
              </DialogTitle>
              <DialogDescription>
                Drop your email below and we'll send you a detailed analysis of your pitch performance.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null); // Clear error on input change
                  }}
                  required
                  className={`w-full ${error ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>
              
              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="w-full sm:w-auto font-medium"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Me the Recap"
                  )}
                </Button>
              </DialogFooter>
              
              <div className="text-center text-sm text-muted-foreground pt-2">
                <p>Want to save your progress? <a href="/signup" className="text-primary hover:underline font-medium">Sign up free</a></p>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <DialogTitle className="text-xl text-center">
                Check Your Email!
              </DialogTitle>
              <DialogDescription className="text-center space-y-2">
                <p className="font-medium">✅ Your pitch recap has been sent to:</p>
                <p className="text-primary font-semibold">{email}</p>
                <p className="text-sm text-muted-foreground pt-2">
                  You should receive it within a few minutes. Check your spam folder if you don't see it.
                </p>
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="pt-6">
              <Button 
                onClick={handleClose}
                className="w-full font-medium"
              >
                Done
              </Button>
            </DialogFooter>
            
            <div className="text-center text-sm text-muted-foreground pt-2">
              <p>Ready to improve your pitch? <a href="/signup" className="text-primary hover:underline font-medium">Sign up for free</a></p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;
