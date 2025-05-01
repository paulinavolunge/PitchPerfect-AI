
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionData?: any;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ open, onOpenChange, sessionData }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // First show immediate confirmation
      toast({
        title: "PDF on its way!",
        description: "Check your inbox for your pitch recap (first a quick confirmation, then the full PDF).",
      });
      
      // Send immediate confirmation email
      await sendImmediateConfirmation(email);
      
      // Send data to waitlist
      await addToWaitlist(email);
      
      // Send session data to CRM immediately with the email
      if (sessionData) {
        const enrichedData = {
          ...sessionData,
          email,
          requestType: "pdf_recap"
        };
        
        // Determine which CRM provider to use
        const provider = determineCRMProvider();
        
        // Fire webhook without waiting
        sendSessionToCRM(enrichedData, provider)
          .then(webhookResult => {
            console.log(`CRM ${provider} webhook result:`, webhookResult);
          })
          .catch(error => {
            console.error(`CRM ${provider} webhook error:`, error);
          });
      }
      
      // Close modal and navigate
      onOpenChange(false);
      navigate('/signup');
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "There was a problem sending your recap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Want a PDF recap of your pitch?</DialogTitle>
          <DialogDescription>
            Drop your email below and we'll send you a detailed analysis of your pitch performance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-brand-dark">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          <DialogFooter className="pt-2">
            <Button 
              type="submit"
              className="bg-brand-blue hover:bg-brand-blue/90 text-white w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Me the Recap"}
            </Button>
          </DialogFooter>
          
          <div className="text-center text-sm text-brand-dark/60">
            <p>You can also <a href="/signup" className="text-brand-blue hover:underline">sign up</a> for a free account now</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;
