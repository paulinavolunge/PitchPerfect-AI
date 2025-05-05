
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

const Pricing = () => {
  const { user, isPremium } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <PricingHeader planType={planType} setPlanType={setPlanType} />
          
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
      
      <StickyCTA show={showStickyCTA} onClick={scrollToDemo} />
      
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
