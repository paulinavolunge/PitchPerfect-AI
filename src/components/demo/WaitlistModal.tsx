
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

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionData?: {
    [key: string]: unknown;
  };
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ open, onOpenChange, sessionData }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      toast({
        title: "PDF on its way!",
        description: "Check your inbox for your pitch recap (first a quick confirmation, then the full PDF).",
      });
      
      // Fire-and-forget ancillary requests to avoid UI flicker
      void sendImmediateConfirmation(email, sessionData).catch(() => {});
      void addToWaitlist(email).catch(() => {});
      
      if (sessionData) {
        const enrichedData = { ...sessionData, email, requestType: "pdf_recap" };
        const provider = determineCRMProvider();
        void sendSessionToCRM(enrichedData, provider).catch(() => {});
      }
      
      // Close modal after a short delay to ensure toast is visible and avoid layout flicker
      setTimeout(() => onOpenChange(false), 300);
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
            <label htmlFor="email" className="text-sm font-medium text-foreground">
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
              variant="default"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Me the Recap"}
            </Button>
          </DialogFooter>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>You can also <a href="/signup" className="text-primary hover:underline">sign up</a> for a free account now</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;
