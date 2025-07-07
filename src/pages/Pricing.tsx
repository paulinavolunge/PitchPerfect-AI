import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Star, Zap, HelpCircle, Clock, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePurchase = async (productType: string) => {
    if (!user) {
      // Show clear authentication options instead of just an error
      toast({
        title: "Sign in required",
        description: "Please create an account or sign in to purchase credits.",
        variant: "default",
        duration: 6000,
        action: (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/login')}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Button>
          </div>
        ),
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

  const handleSignUpRedirect = () => {
    navigate('/signup');
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
      buttonText: user ? 'Get Basic Plan' : 'Sign Up for Basic Plan',
      gradient: 'from-soft-blue-100 to-sky-blue/50'
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
      buttonText: user ? 'Go Professional' : 'Sign Up for Pro Plan',
      gradient: 'from-primary/10 to-sky-blue/30'
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
      buttonText: user ? 'Go Enterprise' : 'Sign Up for Enterprise',
      gradient: 'from-navy/10 to-primary/20'
    }
  ];

  const creditPacks = [
    {
      id: 'credits-20',
      name: '20 Credits',
      price: '$4.99',
      description: 'Perfect for occasional practice',
    },
    {
      id: 'credits-100',
      name: '100 Credits',
      price: '$14.99',
      description: 'Great value for regular users',
    },
    {
      id: 'credits-500',
      name: '500 Credits',
      price: '$49.99',
      description: 'Best value for power users',
    }
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - PitchPerfect AI</title>
        <meta name="description" content="Choose the perfect plan for your sales training needs. Get started with AI-powered pitch practice today." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-soft-blue-50 via-soft-blue-100 to-sky-blue">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-white/80 text-deep-navy border-primary-200 backdrop-blur-sm shadow-lg">
                <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
                Flexible Pricing Plans
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold text-deep-navy mb-6">
                Choose Your <span className="text-primary-600">Practice Plan</span>
              </h1>
              <p className="text-xl text-deep-navy/70 max-w-2xl mx-auto leading-relaxed mb-8">
                Start improving your sales pitch today with AI-powered feedback and analysis
              </p>
              
              {/* Prominent CTA Above the Fold */}
              <div className="mb-8">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary-600 via-primary-500 to-vibrant-blue-500 hover:from-primary-700 hover:via-primary-600 hover:to-vibrant-blue-600 text-white text-xl font-bold px-12 py-6 h-16 shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 transform hover:scale-105 animate-pulse border-0 ring-4 ring-primary-200 hover:ring-primary-300"
                  onClick={handleSignUpRedirect}
                >
                  <UserPlus className="h-6 w-6 mr-3" aria-hidden="true" />
                  Start Free Trial Now
                  <ArrowRight className="h-5 w-5 ml-3" aria-hidden="true" />
                </Button>
                <p className="text-sm text-deep-navy/60 mt-3 font-medium">
                  🎯 Get 1 free AI analysis • No credit card required • Start in 30 seconds
                </p>
              </div>
              
              {!user && (
                <Alert className="max-w-2xl mx-auto mt-8 bg-white/90 border-primary-200 shadow-lg backdrop-blur-sm">
                  <UserPlus className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <AlertDescription className="text-deep-navy">
                    <strong>New to PitchPerfect AI?</strong> Create a free account to get started with 1 free pitch analysis!
                    <div className="flex gap-3 mt-4 justify-center">
                      <Button onClick={handleSignUpRedirect} className="bg-primary-600 hover:bg-primary-700 text-white">
                        <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                        Sign Up Free
                      </Button>
                      <Button onClick={() => navigate('/login')} variant="outline" className="border-primary-200 text-primary-700 hover:bg-primary-50">
                        <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
                        Already have an account?
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="mb-20">
              <h2 className="text-3xl font-bold text-center text-navy mb-12">Monthly Subscription Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className={`modern-card relative card-hover ${plan.popular ? 'scale-105 shadow-soft-xl border-primary/30' : ''}`}>
                    {plan.popular && (
                      <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white shadow-soft">
                        <Star className="h-4 w-4 mr-1" />
                        Most Popular
                      </Badge>
                    )}
                    
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-xl opacity-50`}></div>
                    
                    <CardHeader className="text-center relative z-10">
                      <CardTitle className="text-2xl font-bold text-navy">
                        {plan.name}
                      </CardTitle>
                      <div className="text-4xl font-bold text-primary mb-2">{plan.price}</div>
                      <p className="text-navy/60">{plan.priceNote}</p>
                      <p className="text-navy/70 mt-2">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                            <span className="text-navy">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => user ? handlePurchase(plan.id) : navigate('/signup')}
                        disabled={loading === plan.id}
                        className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-primary-600 to-vibrant-blue-500 hover:from-primary-700 hover:to-vibrant-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                            : 'border-2 border-primary-400 text-primary-700 hover:bg-primary-50 hover:border-primary-500 bg-white'
                        } group`}
                      >
                        {loading === plan.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            {user ? (
                              <>
                                <Zap className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                                {plan.buttonText}
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-5 w-5 mr-2" aria-hidden="true" />
                                {plan.buttonText}
                              </>
                            )}
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center text-navy mb-6">Pay-As-You-Go Credit Packs</h2>
              <div className="flex items-center justify-center gap-2 mb-8">
                <Clock className="h-5 w-5 text-primary" />
                <p className="text-navy/70 font-medium">Credits never expire. Use them anytime.</p>
              </div>
              
              {!user && (
                <Alert className="max-w-md mx-auto mb-8 modern-card bg-yellow-50 border-yellow-200">
                  <UserPlus className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-center">
                    <strong>Account Required:</strong> You need to sign up or log in to purchase credit packs.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {creditPacks.map((pack) => (
                  <Card key={pack.id} className="modern-card card-hover">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl font-bold text-navy">
                        {pack.name}
                      </CardTitle>
                      <div className="text-3xl font-bold text-primary">{pack.price}</div>
                      <p className="text-navy/70">{pack.description}</p>
                    </CardHeader>

                    <CardContent>
                      <Button
                        onClick={() => user ? handlePurchase(pack.id) : navigate('/signup')}
                        disabled={loading === pack.id}
                        className="w-full h-11 border-2 border-primary-400 text-primary-700 hover:bg-primary-50 hover:border-primary-500 bg-white font-semibold transition-all duration-300 group"
                      >
                        {loading === pack.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            {user ? (
                              <>
                                <Zap className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                                Buy Credits
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                                Sign Up to Buy
                              </>
                            )}
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="max-w-2xl mx-auto mb-16">
              <Card className="modern-card bg-gradient-to-r from-primary/5 to-sky-blue/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-navy">How Credits Work</h3>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="credits-info">
                      <AccordionTrigger className="text-left text-navy">
                        💡 Credit Usage & Pricing
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 text-navy/80">
                        <div className="space-y-3">
                          <p className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                            <strong>1 Roleplay Session (Text or Voice) = 1 Credit</strong>
                          </p>
                          <p className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-sky-blue rounded-full"></span>
                            <strong>AI Voice + Feedback Session = 2–3 Credits</strong>
                          </p>
                          <p className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                            <strong>You can always buy more credits if you run out</strong>
                          </p>
                          <p className="flex items-center gap-3">
                            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
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
              <p className="text-navy/70 mb-4 text-lg">
                All plans include a 7-day money-back guarantee
              </p>
              <p className="text-navy/60">
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
