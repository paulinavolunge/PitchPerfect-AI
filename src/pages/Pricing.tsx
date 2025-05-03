
import React, { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ROICalculator from '@/components/ROICalculator';
import GuidedTour from '@/components/GuidedTour';
import { Step } from 'react-joyride';

const Pricing = () => {
  const { user, isPremium } = useAuth();
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();
  const demoRef = useRef<HTMLDivElement>(null);
  const [runTour, setRunTour] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(true);
  
  const handleUpgradeClick = () => {
    if (!user) {
      navigate('/login', { state: { from: '/subscription' } });
      return;
    }
    navigate('/subscription');
  };

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
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-brand-dark mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
              Choose the plan that's right for you and start improving your sales conversations today.
            </p>
            
            <div className="mt-8 max-w-xs mx-auto">
              <Tabs value={planType} onValueChange={(v) => setPlanType(v as "monthly" | "yearly")}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="monthly" className="text-sm">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-sm">Yearly (Save 17%)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto pricing-cards">
            {/* Solo Plan */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Solo</CardTitle>
                <CardDescription>Perfect for individuals</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500 ml-2">forever</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Basic sales practice tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Limited AI tips and feedback</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Progress tracking dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Community support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                {!user ? (
                  <Button className="w-full" variant="outline" onClick={() => navigate('/signup')}>
                    Sign up free
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" onClick={() => navigate('/dashboard')} disabled={isPremium}>
                    Current plan
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Team Plan */}
            <Card className="border-2 border-brand-green shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Team</CardTitle>
                  <span className="bg-brand-green/20 text-brand-green text-xs font-medium px-2 py-1 rounded">POPULAR</span>
                </div>
                <CardDescription>For growing teams</CardDescription>
                <div className="mt-4">
                  {planType === "monthly" ? (
                    <>
                      <span className="text-4xl font-bold">$29</span>
                      <span className="text-gray-500 ml-2">/ user / month</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">$290</span>
                      <span className="text-gray-500 ml-2">/ user / year</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>All Solo plan features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span><strong>AI roleplay practice</strong> with voice or text</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Team analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Unlimited AI tips and suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={!user ? () => navigate('/signup') : handleUpgradeClick} 
                  className="w-full bg-brand-green hover:bg-brand-green/90"
                >
                  {!user 
                    ? (planType === "monthly" ? "Start Monthly Plan" : "Start Yearly Plan")
                    : (isPremium 
                        ? "Manage Subscription" 
                        : `Upgrade to ${planType === "monthly" ? "Monthly" : "Yearly"} Team`)
                  }
                </Button>
              </CardFooter>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For larger organizations</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>All Team features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Custom AI training and scenarios</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Advanced analytics and reporting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>SSO and advanced security</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </CardFooter>
            </Card>
          </div>
          
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
      
      {/* Sticky CTA Button - Only visible when not interacting with ROI calculator */}
      {showStickyCTA && (
        <div className="sticky-cta fixed bottom-6 left-0 right-0 flex justify-center z-40">
          <Button 
            onClick={scrollToDemo} 
            className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-6 rounded-full shadow-lg animate-bounce-subtle"
            size="lg"
          >
            Try It Free
          </Button>
        </div>
      )}
      
      <Footer />
      
      {/* Guided Tour */}
      <GuidedTour
        steps={steps}
        run={runTour}
        onComplete={handleTourComplete}
      />
    </div>
  );
};

export default Pricing;
