
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Star, Zap } from 'lucide-react';
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

  const products = [
    {
      id: 'basic',
      name: 'Basic Practice Pack',
      price: '$29',
      description: 'Perfect for getting started with sales practice',
      features: [
        '50 Practice Credits',
        'Text & Voice Input',
        'AI Feedback Analysis',
        'Progress Tracking',
        'Email Support'
      ],
      popular: false,
      buttonText: 'Get Started'
    },
    {
      id: 'pro',
      name: 'Professional Pack',
      price: '$79',
      description: 'Most popular choice for serious sales professionals',
      features: [
        '200 Practice Credits',
        'Advanced Voice Analysis',
        'Custom Scenarios',
        'Detailed Performance Reports',
        'Priority Support',
        'Team Sharing (up to 3 users)'
      ],
      popular: true,
      buttonText: 'Go Pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      price: '$199',
      description: 'For teams and organizations',
      features: [
        'Unlimited Practice Credits',
        'Custom Branding',
        'Team Analytics Dashboard',
        'Advanced Integrations',
        'Dedicated Success Manager',
        'Custom Training Materials'
      ],
      popular: false,
      buttonText: 'Contact Sales'
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {products.map((product) => (
                <Card key={product.id} className={`relative ${product.popular ? 'border-brand-green shadow-lg scale-105' : ''}`}>
                  {product.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-green">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
                    <div className="text-3xl font-bold text-brand-green">{product.price}</div>
                    <p className="text-brand-dark/70">{product.description}</p>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-brand-green mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePurchase(product.id)}
                      disabled={loading === product.id}
                      className={`w-full ${product.popular ? 'bg-brand-green hover:bg-brand-green/90' : ''}`}
                      variant={product.popular ? 'default' : 'outline'}
                    >
                      {loading === product.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          {product.buttonText}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
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
