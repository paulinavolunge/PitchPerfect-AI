import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Star, Zap, HelpCircle, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePurchase = async (productType: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    setLoading(productType);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productType }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic Practice Pack',
      price: '$29',
      priceNote: 'per month',
      description: 'Perfect for getting started with sales practice',
      features: [
        '50 Credits/month',
        'Text & Voice Input',
        'AI Feedback Analysis',
        'Progress Tracking',
        'Email Support'
      ],
      popular: false,
      buttonText: 'Get Basic Plan',
      color: 'border-green-500',
      bgColor: 'bg-green-50',
      emoji: '🟩'
    },
    {
      id: 'pro',
      name: 'Professional Pack',
      price: '$79',
      priceNote: 'per month',
      description: 'Most popular choice for serious sales professionals',
      features: [
        '200 Credits/month',
        'Advanced Voice Analysis',
        'Custom Scenarios',
        'Detailed Performance Reports',
        'Priority Support',
        'Team Sharing (up to 3 users)'
      ],
      popular: true,
      buttonText: 'Go Professional',
      color: 'border-blue-500',
      bgColor: 'bg-blue-50',
      emoji: '🟦'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      price: '$199',
      priceNote: 'per month',
      description: 'For teams and organizations',
      features: [
        'Unlimited Credits',
        'Custom Branding',
        'Team Analytics Dashboard',
        'Advanced Integrations',
        'Dedicated Success Manager',
        'Custom Training Materials'
      ],
      popular: false,
      buttonText: 'Go Enterprise',
      color: 'border-red-500',
      bgColor: 'bg-red-50',
      emoji: '🟥'
    }
  ];

  const creditPacks = [
    {
      id: 'credits-20',
      name: '20 Credits',
      price: '$4.99',
      description: 'Perfect for occasional practice',
      emoji: '🎯'
    },
    {
      id: 'credits-100',
      name: '100 Credits',
      price: '$14.99',
      description: 'Great value for regular users',
      emoji: '🎯'
    },
    {
      id: 'credits-500',
      name: '500 Credits',
      price: '$49.99',
      description: 'Best value for power users',
      emoji: '🎯'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - PitchPerfect AI</title>
        <meta name="description" content="Choose the perfect plan for your sales training needs. Get started with AI-powered pitch practice today." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-brand-dark mb-4">
                Choose Your Practice Plan
              </h1>
              <p className="text-xl text-brand-dark/70 max-w-2xl mx-auto">
                Start improving your sales pitch today with AI-powered feedback and analysis
              </p>
            </div>

            <div className="mb-16">
              <h2 className="text-2xl font-bold text-center mb-8">Monthly Subscription Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className={`relative ${plan.popular ? 'border-brand-green shadow-lg scale-105' : plan.color} ${plan.bgColor} border-2`}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-green">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                        <span className="text-2xl">{plan.emoji}</span>
                        {plan.name}
                      </CardTitle>
                      <div className="text-3xl font-bold text-brand-green">{plan.price}</div>
                      <p className="text-sm text-brand-dark/60">{plan.priceNote}</p>
                      <p className="text-brand-dark/70">{plan.description}</p>
                    </CardHeader>

                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-4 w-4 text-brand-green mr-2 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handlePurchase(plan.id)}
                        disabled={loading === plan.id}
                        className="w-full border-2 border-brand-green bg-white text-brand-green hover:bg-brand-green hover:text-white transition-all duration-300"
                        variant="outline"
                      >
                        {loading === plan.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            {plan.buttonText}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-4">Pay-As-You-Go Credit Packs</h2>
              <div className="flex items-center justify-center gap-2 mb-8">
                <Clock className="h-4 w-4 text-brand-green" />
                <p className="text-brand-dark/70 font-medium">Credits never expire. Use them anytime.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {creditPacks.map((pack) => (
                  <Card key={pack.id} className="border-2 border-gray-200 hover:border-brand-green transition-colors">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                        <span className="text-xl">{pack.emoji}</span>
                        {pack.name}
                      </CardTitle>
                      <div className="text-2xl font-bold text-brand-green">{pack.price}</div>
                      <p className="text-sm text-brand-dark/70">{pack.description}</p>
                    </CardHeader>

                    <CardContent>
                      <Button
                        onClick={() => handlePurchase(pack.id)}
                        disabled={loading === pack.id}
                        className="w-full border-2 border-brand-green bg-white text-brand-green hover:bg-brand-green hover:text-white transition-all duration-300"
                        variant="outline"
                      >
                        {loading === pack.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Buy Credits
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="max-w-2xl mx-auto mb-12">
              <Card className="border border-brand-green/20 bg-brand-green/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5 w-5 text-brand-green" />
                    <h3 className="text-lg font-semibold">How Credits Work</h3>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="credits-info">
                      <AccordionTrigger className="text-left">
                        💡 Credit Usage & Pricing
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-green rounded-full"></span>
                            <strong>1 Roleplay Session (Text or Voice) = 1 Credit</strong>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-blue rounded-full"></span>
                            <strong>AI Voice + Feedback Session = 2–3 Credits</strong>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-green rounded-full"></span>
                            <strong>You can always buy more credits if you run out</strong>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <strong>Credits never expire - use them anytime</strong>
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-brand-dark/70 mb-4">
                All plans include a 7-day money-back guarantee
              </p>
              <p className="text-sm text-brand-dark/50">
                Secure payments powered by Stripe • Cancel anytime
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Pricing;
