
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import PlanComparison from '@/components/subscription/PlanComparison';
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement';
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, XIcon } from 'lucide-react';

const Subscription = () => {
  const { toast } = useToast();

  const handleUpgradeClick = () => {
    // This would connect to your payment processor in a real implementation
    toast({
      title: "Payment flow initiated",
      description: "You'll be redirected to complete your payment shortly.",
    });
    
    // Simulate redirect to payment processor
    setTimeout(() => {
      toast({
        title: "Demo mode",
        description: "In a real app, you would be redirected to a payment page.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-brand-dark mb-4">Choose Your Plan</h1>
            <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
              Unlock premium features to elevate your sales conversations and close more deals with confidence.
            </p>
          </div>
          
          <PlanComparison />
          
          <div className="mt-16 max-w-4xl mx-auto">
            <SubscriptionManagement onUpgradeClick={handleUpgradeClick} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subscription;
