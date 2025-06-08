
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId && user) {
      // Refresh user subscription status
      refreshSubscription();
      
      // Show success message
      toast({
        title: "Payment Successful!",
        description: "Your credits have been added to your account.",
        duration: 5000,
      });

      setProcessing(false);
    } else if (!sessionId) {
      setProcessing(false);
    }
  }, [sessionId, user, refreshSubscription, toast]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p>Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
        <div className="container max-w-2xl px-4">
          <Card className="text-center p-8">
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-brand-dark mb-2">
                  Payment Successful!
                </h1>
                <p className="text-brand-dark/70 text-lg">
                  Thank you for your purchase. Your credits have been added to your account.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
                <ul className="text-green-700 text-left space-y-1">
                  <li>• Your practice credits are now available</li>
                  <li>• Start practicing with AI-powered roleplay scenarios</li>
                  <li>• Get detailed feedback on your performance</li>
                  <li>• Track your progress over time</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/roleplay')}
                >
                  Start Practicing
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-brand-dark/50">
                  Need help? Contact us at support@pitchperfect.ai
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Success;
