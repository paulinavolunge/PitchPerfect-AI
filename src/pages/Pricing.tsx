
import React, { useState, useRef } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';

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

  // Track page view on component mount
  React.useEffect(() => {
    trackEvent('pricing_page_viewed');
  }, []);

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

  // Handle plan type change with analytics
  const handlePlanTypeChange = (newPlanType: "monthly" | "yearly") => {
    setPlanType(newPlanType);
    trackEvent('plan_type_selected', { type: newPlanType });
  };

  // Handle enterprise size change with analytics
  const handleEnterpriseSizeChange = (newSize: "small" | "medium" | "large") => {
    setEnterpriseSize(newSize);
    trackEvent('enterprise_size_selected', { size: newSize });
  };

  // Track scroll position to manage sticky CTA visibility
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Show sticky CTA after scrolling past the header
      if (scrollPosition > windowHeight * 0.5) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once on initial load
    
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
      target: '.sticky-cta',
      content: 'Start your free trial anytime!',
      disableBeacon: true,
    }
  ];

  // Handle tour completion
  const handleTourComplete = () => {
    localStorage.setItem('pricing_tour_completed', 'true');
    trackEvent('pricing_tour_completed');
  };

  // Get appropriate CTA text based on user status
  const getStickyCTAText = () => {
    if (!user) {
      return "Start Free Trial";
    } else if (trialActive) {
      return "Go to Dashboard";
    } else if (isPremium) {
      return "Manage Subscription";
    } else {
      return "Start Free Trial";
    }
  };

  // Handle sticky CTA click based on user status
  const handleStickyCTAClick = () => {
    const userStatus = user ? (isPremium ? 'premium' : (trialActive ? 'trial' : 'free')) : 'guest';
    trackEvent('sticky_cta_clicked', { userStatus });
    
    if (!user) {
      navigate('/signup');
    } else if (trialActive || isPremium) {
      navigate('/dashboard');
    } else {
      navigate('/subscription');
    }
  };

  const daysLeft = calculateDaysRemaining();

  return (
    <div className="min-h-screen flex flex-col relative">
      <Helmet>
        <title>Pricing Plans | PitchPerfect AI - Sales Training That Works</title>
        <meta name="description" content="Choose the perfect plan for your sales training needs. Start free and upgrade as you grow. 14-day free trial, no credit card required." />
        <meta property="og:title" content="PitchPerfect AI Pricing - Sales Training Plans" />
        <meta property="og:description" content="Affordable sales training plans starting at $9/month. Free trial available." />
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
                ⚠️ Only {daysLeft} days left in your trial. Choose a plan to keep access to AI tools.
              </p>
            </div>
          )}
          
          <PricingHeader 
            planType={planType} 
            setPlanType={handlePlanTypeChange} 
            trialActive={trialActive} 
            isPremium={isPremium} 
          />
          
          <div className="pricing-cards">
            <PricingPlans 
              planType={planType} 
              enterpriseSize={enterpriseSize} 
              setEnterpriseSize={handleEnterpriseSizeChange} 
              promoExpiryDate={promoExpiryDate} 
            />
          </div>
          
          <div className="mt-20">
            <ValueProposition />
          </div>
          
          <div className="mt-20">
            <PricingFAQ />
          </div>
          
          <div className="text-center mt-20 bg-gradient-to-r from-brand-blue/5 to-brand-green/5 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-brand-dark mb-4">Ready to Transform Your Sales Performance?</h3>
            <p className="text-lg text-brand-dark/70 mb-6 max-w-2xl mx-auto">
              Join thousands of sales professionals who have improved their closing rates with PitchPerfect AI
            </p>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-brand-blue to-brand-green hover:from-brand-blue/90 hover:to-brand-green/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial Today
            </button>
            <p className="text-sm text-brand-dark/60 mt-3">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
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
