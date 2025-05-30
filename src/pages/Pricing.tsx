import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GuidedTour from '@/components/GuidedTour';
import { Step } from 'react-joyride';
import PricingHeader from '@/components/pricing/PricingHeader';
import PricingPlans from '@/components/pricing/PricingPlans';
import PricingFAQ from '@/components/pricing/PricingFAQ';
import ValueProposition from '@/components/pricing/ValueProposition';
import StickyCTA from '@/components/pricing/StickyCTA';
import Testimonials from '@/components/Testimonials';
import { AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key - using import.meta.env for Vite
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here');

const Pricing = () => {
  const { user, isPremium, creditsRemaining, trialUsed } = useAuth();
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [enterpriseSize, setEnterpriseSize] = useState<"small" | "medium" | "large">("small");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const demoRef = useRef<HTMLDivElement>(null);
  const [runTour, setRunTour] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(true);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [referralApplied, setReferralApplied] = useState(false);

  const promoExpiryDate = new Date();
  promoExpiryDate.setDate(promoExpiryDate.getDate() + 14);

  useEffect(() => {
    trackEvent('pricing_page_viewed');
  }, []);

  // Define specific Stripe Price IDs for your plans - using import.meta.env for Vite
  const priceIds = {
    starter: {
      monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_1PfgD7B9Q0k12345abcdef',
      yearly: import.meta.env.VITE_STRIPE_STARTER_YEARLY_PRICE_ID || 'price_1PfgEJB9Q0k12345ghijkl',
      credits: 30,
    },
    professional: {
      monthly: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_1PfgF9B9Q0k12345mnopqr',
      yearly: import.meta.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_1PfgGSB9Q0k12345stuvwx',
      credits: 100,
    },
    team: {
      small: {
        monthly: import.meta.env.VITE_STRIPE_TEAM_SMALL_MONTHLY_PRICE_ID || 'price_team_small_m',
        yearly: import.meta.env.VITE_STRIPE_TEAM_SMALL_YEARLY_PRICE_ID || 'price_team_small_y',
        credits: 500
      },
      medium: {
        monthly: import.meta.env.VITE_STRIPE_TEAM_MEDIUM_MONTHLY_PRICE_ID || 'price_team_medium_m',
        yearly: import.meta.env.VITE_STRIPE_TEAM_MEDIUM_YEARLY_PRICE_ID || 'price_team_medium_y',
        credits: 1500
      },
      large: {
        monthly: import.meta.env.VITE_STRIPE_TEAM_LARGE_MONTHLY_PRICE_ID || 'price_team_large_m',
        yearly: import.meta.env.VITE_STRIPE_TEAM_LARGE_YEARLY_PRICE_ID || 'price_team_large_y',
        credits: 3000
      },
    },
  };

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!user) {
      trackEvent('checkout_attempt_unauthenticated', { plan: planName });
      navigate('/signup', { state: { from: '/pricing', plan: planName } });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true&plan=${planName}`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        },
      });

      if (error || !data?.url) {
        throw new Error(error?.message || 'No checkout URL returned');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error.message);
      toast({
        title: 'Checkout Error',
        description: 'Unable to initiate checkout. Please try again.',
        variant: 'destructive',
      });
      trackEvent('checkout_error', {
        plan: planName,
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const steps: Step[] = [
    {
      target: '.pricing-cards',
      content: 'Choose the plan that best fits your needs.',
      disableBeacon: true,
    },
    {
      target: '.sticky-cta',
      content: 'Start your free pitch analysis or top up credits anytime!',
      disableBeacon: true,
    },
  ];

  const handleTourComplete = () => {
    localStorage.setItem('pricing_tour_completed', 'true');
    trackEvent('pricing_tour_completed');
  };

  const getStickyCTAText = () => {
    if (!user) return 'Sign Up for Free';
    if (!trialUsed) return 'Get 1 Free Pitch Analysis';
    if (creditsRemaining > 0) return `Start Practice (${creditsRemaining} credits)`;
    if (isPremium) return 'Manage Subscription';
    return 'Top Up Credits';
  };

  const handleStickyCTAClick = () => {
    if (!user) return navigate('/signup');
    if (!trialUsed) return navigate('/demo');
    if (isPremium) return navigate('/dashboard');
    navigate('/pricing');
  };

  useEffect(() => {
    if (searchParams.get('success')) {
      toast({
        title: "Subscription successful!",
        description: "Thank you for subscribing to PitchPerfect AI Premium. Credits added to your account!",
      });
      searchParams.delete('success');
      setSearchParams(searchParams);
    } else if (searchParams.get('canceled')) {
      toast({
        title: "Subscription canceled",
        description: "Your subscription process was canceled.",
      });
      searchParams.delete('canceled');
      setSearchParams(searchParams);
    }
  }, [toast, searchParams, setSearchParams]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Helmet>
        <title>Pricing Plans | PitchPerfect AI</title>
        <meta name="description" content="Choose your plan and start training your sales team with AI." />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {user && !isPremium && !trialUsed && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-lg mx-auto text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="font-medium text-yellow-800">1 Free Pitch Analysis Available!</p>
              </div>
              <p className="text-yellow-700 text-sm mb-2">
                Start a demo now to use your free pitch analysis and see your AI feedback.
              </p>
            </div>
          )}
          {user && !isPremium && trialUsed && creditsRemaining === 0 && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-lg mx-auto text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="font-medium text-red-800">No Credits Remaining</p>
              </div>
              <p className="text-red-700 text-sm mb-2">
                Your free pitch analysis has been used, and you have no credits left. Please upgrade to continue.
              </p>
            </div>
          )}

          <PricingHeader
            planType={planType}
            setPlanType={setPlanType}
          />

          <div className="pricing-cards">
            <PricingPlans
              planType={planType}
              enterpriseSize={enterpriseSize}
              setEnterpriseSize={setEnterpriseSize}
              promoExpiryDate={promoExpiryDate}
              onCheckout={handleCheckout}
              priceIds={priceIds}
              isLoading={isLoading}
              user={user}
              isPremium={isPremium}
              creditsRemaining={creditsRemaining}
              trialUsed={trialUsed}
            />
          </div>

          <div className="mt-20">
            <ValueProposition />
          </div>

          <div className="mt-20">
            <Testimonials />
          </div>

          <div className="mt-20">
            <PricingFAQ />
          </div>

          <div className="text-center mt-20 bg-gradient-to-r from-brand-blue/5 to-brand-green/5 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-brand-dark mb-4">Ready to Transform Your Sales?</h3>
            <p className="text-lg text-brand-dark/70 mb-6 max-w-2xl mx-auto">
              Join thousands who improved their pitch with AI.
            </p>
            <button
              onClick={handleStickyCTAClick}
              className="bg-gradient-to-r from-brand-blue to-brand-green text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-all"
            >
              {getStickyCTAText()}
            </button>
            <p className="text-sm text-brand-dark/60 mt-3">No credit card required for free analysis • Cancel anytime</p>
          </div>
        </div>
      </main>

      <StickyCTA show={showStickyCTA} onClick={handleStickyCTAClick} text={getStickyCTAText()} />

      <Footer />

      <GuidedTour steps={steps} run={runTour} onComplete={handleTourComplete} />
    </div>
  );
};

export default Pricing;
