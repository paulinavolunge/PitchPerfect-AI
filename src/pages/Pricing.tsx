
import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const Pricing = () => {
  const { user, isPremium, trialActive, trialEndsAt } = useAuth();
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [enterpriseSize, setEnterpriseSize] = useState<"small" | "medium" | "large">("small");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const demoRef = useRef<HTMLDivElement>(null);
  const [runTour, setRunTour] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(true);
  const { toast } = useToast();

  const promoExpiryDate = new Date();
  promoExpiryDate.setDate(promoExpiryDate.getDate() + 14);

  useEffect(() => {
    trackEvent('pricing_page_viewed');
  }, []);

  const priceIds = {
    micro: {
      monthly: 'price_1RSNCvRv5Z8vxUAitUftsd9h',
      yearly: 'price_1RSNewRv5Z8vxUAij9QjCAwI',
    },
    solo: {
      monthly: 'price_1RSNFLRv5Z8vxUAiCdjDQCVJ',
      yearly: 'price_1RSNfSRv5Z8vxUAiWx2L9ZFs',
    },
    professional: {
      monthly: 'price_1RSNFnRv5Z8vxUAiyQ4YjOoy',
      yearly: 'price_1RSNg7Rv5Z8vxUAicG7mlT2m',
    },
    team: {
      small: {
        monthly: 'price_1RSNP2Rv5Z8vxUAip2CaI6FU',
        yearly: 'price_1RSNjDRv5Z8vxUAil7WNjJfy',
      },
      medium: {
        monthly: 'price_1RSNP2Rv5Z8vxUAip2CaI6FU',
        yearly: 'price_1RSNjDRv5Z8vxUAil7WNjJfy',
      },
      large: {
        monthly: 'price_1RSNP2Rv5Z8vxUAip2CaI6FU',
        yearly: 'price_1RSNjDRv5Z8vxUAil7WNjJfy',
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

  const calculateDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const diffTime = trialEndsAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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
      content: 'Start your free trial anytime!',
      disableBeacon: true,
    },
  ];

  const handleTourComplete = () => {
    localStorage.setItem('pricing_tour_completed', 'true');
    trackEvent('pricing_tour_completed');
  };

  const getStickyCTAText = () => {
    if (!user) return 'Start Free Trial';
    if (trialActive) return 'Go to Dashboard';
    if (isPremium) return 'Manage Subscription';
    return 'Start Free Trial';
  };

  const handleStickyCTAClick = () => {
    if (!user) return navigate('/signup');
    if (trialActive || isPremium) return navigate('/dashboard');
    navigate('/subscription');
  };

  const daysLeft = calculateDaysRemaining();

  return (
    <div className="min-h-screen flex flex-col relative">
      <Helmet>
        <title>Pricing Plans | PitchPerfect AI</title>
        <meta name="description" content="Choose your plan and start training your sales team with AI." />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {trialActive && !isPremium && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-lg mx-auto text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                <p className="font-medium text-amber-800">Your free trial is active</p>
              </div>
              <p className="text-amber-700 text-sm mb-2">
                ⚠️ Only {daysLeft} days left in your trial. Choose a plan to keep access.
              </p>
            </div>
          )}

          <PricingHeader
            planType={planType}
            setPlanType={setPlanType}
            trialActive={trialActive}
            isPremium={isPremium}
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
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-brand-blue to-brand-green text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 transition-all"
            >
              Start Your Free Trial Today
            </button>
            <p className="text-sm text-brand-dark/60 mt-3">No credit card required • Cancel anytime</p>
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
