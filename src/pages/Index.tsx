
import React, { useState, lazy, Suspense, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DemoSandbox from '@/components/demo/DemoSandbox';
import TimeOffer from '@/components/promotion/TimeOffer';

// Lazy load below-the-fold components for better performance
const Features = lazy(() => import('@/components/Features'));
const HowItWorks = lazy(() => import('@/components/HowItWorks'));
const Testimonials = lazy(() => import('@/components/Testimonials'));
const CTASection = lazy(() => import('@/components/CTASection'));
const Footer = lazy(() => import('@/components/Footer'));
const NewsletterSignup = lazy(() => import('@/components/NewsletterSignup'));

const Index = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(true);
  
  // Create a promotion expiry date (30 days from now)
  const promoExpiryDate = new Date();
  promoExpiryDate.setDate(promoExpiryDate.getDate() + 30);
  
  // Check localStorage to see if user has dismissed the promo
  useEffect(() => {
    const hasClosedPromo = localStorage.getItem('promoAnnualDismissed');
    if (hasClosedPromo) {
      setShowPromotion(false);
    }
  }, []);
  
  const handleClosePromotion = () => {
    setShowPromotion(false);
    localStorage.setItem('promoAnnualDismissed', 'true');
  };
  
  // Scroll to CTA section when Book Demo is clicked
  const scrollToCTA = (section: string) => {
    setActiveSection(section);
    const ctaSection = document.getElementById('cta-section');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {showPromotion && (
        <TimeOffer
          expiryDate={promoExpiryDate}
          discount="1 Month Free"
          description="Get 1 month free with annual Team Plan purchase"
          variant="banner"
          ctaText="Claim Offer"
          ctaLink="/pricing"
          onClose={handleClosePromotion}
        />
      )}
      
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <section className="py-12 bg-gradient-to-b from-white to-brand-blue/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-brand-dark">AI Roleplay Practice</h2>
              <p className="text-lg mb-8 text-brand-dark/70">
                Practice your pitch in real-time with our advanced AI roleplay system. 
                Choose between voice or text interaction and get instant feedback.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    {isPremium ? (
                      <Button className="btn-primary flex items-center gap-2" onClick={() => navigate('/roleplay')}>
                        Try Roleplay Now <ArrowRight size={18} />
                      </Button>
                    ) : (
                      <Button className="btn-primary flex items-center gap-2" onClick={() => navigate('/pricing')}>
                        Upgrade to Access <ArrowRight size={18} />
                      </Button>
                    )}
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/practice')}>
                      Basic Practice
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="btn-primary flex items-center gap-2" onClick={() => navigate('/signup')}>
                      Start Free Trial <ArrowRight size={18} />
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/compare')}>
                      See How We Compare
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section id="demo-sandbox" className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-brand-dark text-center mb-8">Try PitchPerfect AI</h2>
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
              <DemoSandbox />
            </div>
          </div>
        </section>
        
        <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
          <Features />
        </Suspense>
        
        <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
          <HowItWorks />
        </Suspense>
        
        <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
          <NewsletterSignup />
        </Suspense>
        
        <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
          <Testimonials />
        </Suspense>
        
        <div id="cta-section">
          <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
            <CTASection activeSection={activeSection} />
          </Suspense>
        </div>
      </main>
      
      <Suspense fallback={<div className="py-6 text-center">Loading footer...</div>}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
