
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

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await addToWaitlist(email);
      
      toast({
        title: "Success!",
        description: "Thank you for joining our waitlist!",
      });
      
      onOpenChange(false);
      navigate('/signup');
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({
        title: "Error",
        description: "There was a problem adding you to the waitlist. Please try again.",
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
          <DialogTitle className="text-xl">Ready for more practice?</DialogTitle>
          <DialogDescription>
            Join our waitlist to get early access to PitchPerfect AI and improve your sales pitches with real-time AI feedback.
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
              {isSubmitting ? "Submitting..." : "Join Waitlist"}
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
