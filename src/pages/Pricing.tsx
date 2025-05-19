
import React, { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ROICalculator from '@/components/ROICalculator';
import GuidedTour from '@/components/GuidedTour';
import { Step } from 'react-joyride';
import PricingHeader from '@/components/pricing/PricingHeader';
import PricingPlans from '@/components/pricing/PricingPlans';
import StickyCTA from '@/components/pricing/StickyCTA';
import { Clock } from 'lucide-react';

const Pricing = () => {
  const { user, isPremium, trialActive, trialEndsAt } = useAuth();
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [enterpriseSize, setEnterpriseSize] = useState<"small" | "medium" | "large">("small");
  const navigate = useNavigate();
  const demoRef = useRef<HTMLDivElement>(null);
  const [runTour, setRunTour] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(true);
  
  // Create a promotion expiry date (14 days from now)
  const promoExpiryDate = new Date();
  promoExpiryDate.setDate(promoExpiryDate.getDate() + 14);

  const scrollToDemo = () => {
    if (demoRef.current) {
      demoRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/demo');
    }
  };

  // Calculate days remaining in trial
  const calculateDaysRemaining = () => {
    if (!trialEndsAt) return 0;
    
    const now = new Date();
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Track scroll position to manage sticky CTA visibility
  React.useEffect(() => {
    const handleScroll = () => {
      // Get the position of the ROI calculator
      const roiCalc = document.querySelector('.roi-calculator');
      if (roiCalc) {
        const rect = roiCalc.getBoundingClientRect();
        // If the ROI calculator is visible and being interacted with, hide the global sticky CTA
        // to avoid duplicate CTAs since the calculator now has its own CTA
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setShowStickyCTA(false);
        } else {
          setShowStickyCTA(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Run once on initial load
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Tour steps
  const steps: Step[] = [
    {
      target: '.pricing-cards',
      content: 'Choose the plan that best fits your needs. Compare features and pricing.',
      disableBeacon: true,
    },
    {
      target: '.roi-calculator',
      content: 'Calculate your potential return on investment with our ROI calculator.',
      disableBeacon: true,
    },
    {
      target: '.sticky-cta',
      content: 'Try our demo without signing up!',
      disableBeacon: true,
    }
  ];

  // Handle tour completion
  const handleTourComplete = () => {
    localStorage.setItem('pricing_tour_completed', 'true');
  };

  // Get appropriate CTA text based on user status
  const getStickyCTAText = () => {
    if (!user) {
      return "Try Free Demo";
    } else if (trialActive) {
      return "Continue Your Trial";
    } else if (isPremium) {
      return "Go to Dashboard";
    } else {
      return "Start Free Trial";
    }
  };

  // Handle sticky CTA click based on user status
  const handleStickyCTAClick = () => {
    if (!user) {
      scrollToDemo();
    } else if (trialActive || isPremium) {
      navigate('/dashboard');
    } else {
      navigate('/subscription');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {trialActive && !isPremium && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-lg mx-auto text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-amber-600 mr-2" />
                <p className="font-medium text-amber-800">Your free trial is active</p>
              </div>
              <p className="text-amber-700 text-sm mb-2">
                You have {calculateDaysRemaining()} days left. Choose a plan to continue access after your trial ends.
              </p>
            </div>
          )}
          
          <PricingHeader 
            planType={planType} 
            setPlanType={setPlanType} 
            trialActive={trialActive} 
            isPremium={isPremium} 
          />
          
          <PricingPlans 
            planType={planType} 
            enterpriseSize={enterpriseSize} 
            setEnterpriseSize={setEnterpriseSize} 
            promoExpiryDate={promoExpiryDate} 
          />
          
          <div className="max-w-3xl mx-auto mt-20 roi-calculator">
            <ROICalculator />
          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-brand-dark/70">
              All plans include a 14-day free trial. No credit card required until trial ends.
            </p>
          </div>
          
          <div ref={demoRef} id="demo-section" className="mt-20">
            {/* Demo content would go here if needed */}
          </div>
        </div>
      </main>
      
      <StickyCTA 
        show={showStickyCTA} 
        onClick={handleStickyCTAClick} 
        text={getStickyCTAText()}
      />
      
      <Footer />
      
      <GuidedTour
        steps={steps}
        run={runTour}
        onComplete={handleTourComplete}
      />
    </div>
  );
};

export default Pricing;
