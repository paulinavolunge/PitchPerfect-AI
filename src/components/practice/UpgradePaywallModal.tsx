import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Zap, Users, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/utils/analytics';

interface UpgradePaywallModalProps {
  open: boolean;
}

const UpgradePaywallModal: React.FC<UpgradePaywallModalProps> = ({ open }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = async (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    setLoading(planId);
    trackEvent('paywall_upgrade_clicked', { plan: planId });

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productType: planId, quantity: planId === 'team' ? 3 : 1 },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            You've used your free round!
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-2">
            Ready to close more deals? Go unlimited to keep going.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Solo Plan */}
          <Card className="border-2 border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4 sm:p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Solo Plan</h3>
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-foreground">$29</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground mb-4 flex-1">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" />Unlimited rounds</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" />AI scoring & feedback</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" />Voice & text roleplay</li>
              </ul>
              <Button
                onClick={() => handleCheckout('solo')}
                disabled={loading === 'solo'}
                className="w-full"
              >
                {loading === 'solo' ? 'Loading...' : 'Get Solo'}
              </Button>
            </CardContent>
          </Card>

          {/* Team Plan */}
          <Card className="border-2 border-primary/30 bg-primary/[0.02] relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                Popular
              </span>
            </div>
            <CardContent className="p-4 sm:p-5 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Team Plan</h3>
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-foreground">$49</span>
                <span className="text-sm text-muted-foreground">/seat/mo</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground mb-4 flex-1">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" />Everything in Solo</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" />Team analytics</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary shrink-0" />Priority support</li>
              </ul>
              <Button
                onClick={() => handleCheckout('team')}
                disabled={loading === 'team'}
                className="w-full"
                variant="default"
              >
                {loading === 'team' ? 'Loading...' : 'Get Team'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Cancel anytime · 30-day money-back guarantee · Secure checkout via Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePaywallModal;
