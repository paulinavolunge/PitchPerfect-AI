
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Crown, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription, creditsRemaining } = useAuth();
  
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type'); // 'subscription' or 'credits'
  const planName = searchParams.get('plan');
  const creditsAmount = searchParams.get('credits');

  useEffect(() => {
    // Refresh subscription status when landing on success page
    if (refreshSubscription) {
      refreshSubscription();
    }

    // Show appropriate success toast based on purchase type
    if (type === 'subscription' && planName) {
      toast({
        title: `Welcome to ${planName}!`,
        description: `You're now subscribed to the ${planName} plan. Your monthly credits have been added.`,
        duration: 6000,
        action: (
          <Crown className="h-5 w-5 text-yellow-600" />
        ),
      });
    } else if (type === 'credits' && creditsAmount) {
      toast({
        title: "Credits Added Successfully!",
        description: `${creditsAmount} credits have been added to your account.`,
        duration: 6000,
        action: (
          <CreditCard className="h-5 w-5 text-green-600" />
        ),
      });
    } else {
      // Generic success message
      toast({
        title: "Payment Successful!",
        description: "Your purchase has been processed successfully.",
        duration: 5000,
        action: (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ),
      });
    }
  }, [refreshSubscription, type, planName, creditsAmount]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-brand-dark">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {type === 'subscription' && planName && (
              <p className="text-brand-dark/80">
                You're now subscribed to the <strong>{planName}</strong> plan. 
                Your monthly credits have been added to your account.
              </p>
            )}
            {type === 'credits' && creditsAmount && (
              <p className="text-brand-dark/80">
                <strong>{creditsAmount} credits</strong> have been added to your account.
                You now have <strong>{creditsRemaining}</strong> total credits.
              </p>
            )}
            {!type && (
              <p className="text-brand-dark/80">
                Your purchase has been processed successfully. You can now access your premium features.
              </p>
            )}
            <div className="pt-4">
              <Button 
                onClick={handleContinue}
                className="w-full bg-brand-blue hover:bg-brand-blue/90"
              >
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Success;
