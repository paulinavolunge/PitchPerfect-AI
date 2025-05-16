import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DemoSandbox from '@/components/demo/DemoSandbox';
import TimeOffer from '@/components/promotion/TimeOffer';
import StickyCTA from '@/components/pricing/StickyCTA';
import ParallaxSection from '@/components/animations/ParallaxSection';
import { motion } from 'framer-motion';

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
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  
  // Create a promotion expiry date (30 days from now)
  const promoExpiryDate = new Date();
  promoExpiryDate.setDate(promoExpiryDate.getDate() + 30);
  
  // Check localStorage to see if user has dismissed the promo
  useEffect(() => {
    const hasClosedPromo = localStorage.getItem('promoAnnualDismissed');
    if (hasClosedPromo) {
      setShowPromotion(false);
    }
    
    // Control sticky CTA visibility on scroll
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowStickyCTA(scrollTop > 1000 && !user);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user]);
  
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
  
  const handleStickyCTAClick = () => {
    navigate('/signup');
  };
  
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Helmet>
        <title>PitchPerfect AI – Real-Time Objection Handling Practice for Sales Pros</title>
        <meta name="description" content="Train, practice, and refine your sales pitches with real-time voice feedback and personalized AI coaching. Master objection handling and close more deals." />
        <meta property="og:title" content="PitchPerfect AI – Real-Time Objection Handling Practice for Sales Pros" />
        <meta property="og:description" content="Train, practice, and refine your sales pitches with real-time voice feedback and personalized AI coaching." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pitchperfectai.ai" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PitchPerfect AI – Sales Practice Platform" />
        <meta name="twitter:description" content="Train, practice, and refine your sales pitches with real-time voice feedback and personalized AI coaching." />
      </Helmet>
      
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
        
        <ParallaxSection className="py-12" direction="down" depth={0.1}>
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h2 
                className="text-3xl font-bold mb-6 text-brand-dark"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                AI Roleplay Practice
              </motion.h2>
              <motion.p 
                className="text-lg mb-8 text-brand-dark/70"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Practice your pitch in real-time with our advanced AI roleplay system. 
                Choose between voice or text interaction and get instant feedback.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {user ? (
                  <>
                    {isPremium ? (
                      <Button className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => navigate('/roleplay')}>
                        Try Roleplay Now <ArrowRight size={18} />
                      </Button>
                    ) : (
                      <Button className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => navigate('/pricing')}>
                        Upgrade to Access <ArrowRight size={18} />
                      </Button>
                    )}
                    <Button variant="outline" className="flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => navigate('/practice')}>
                      Basic Practice
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7c4aea] hover:to-[#6b2ee0] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 px-6 py-3 hover:scale-105" 
                      onClick={() => navigate('/signup')}
                    >
                      Start Free Trial <ArrowRight size={18} />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 border hover:bg-gray-50 transition-transform hover:scale-105 duration-300" 
                      onClick={() => navigate('/compare')}
                    >
                      See How We Compare
                    </Button>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </ParallaxSection>
        
        <section id="demo-sandbox" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-brand-dark text-center mb-2">Try PitchPerfect AI</h2>
              <p className="text-center text-brand-dark/70 mb-8 max-w-2xl mx-auto">
                Experience our AI-powered sales coaching platform with a quick demo
              </p>
            </motion.div>
            <motion.div
              className="max-w-3xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-6 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DemoSandbox />
            </motion.div>
          </div>
        </section>
        
        <Suspense fallback={
          <div className="py-12 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        }>
          <Features />
        </Suspense>
        
        <Suspense fallback={
          <div className="py-12 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        }>
          <HowItWorks />
        </Suspense>
        
        <ParallaxSection className="py-12 bg-gray-50" direction="right" depth={0.15}>
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-3xl mx-auto bg-white backdrop-blur-lg bg-white/90 p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="hidden sm:flex items-center justify-center bg-green-50 p-3 rounded-full">
                <Shield className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-xl mb-2 text-center sm:text-left">Data Security & Privacy</h3>
                <p className="text-gray-600 mb-4 text-center sm:text-left">
                  Your data is encrypted and protected using advanced security protocols. We value your privacy.
                </p>
                <div className="flex justify-center sm:justify-start">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-brand-green hover:scale-105 transition-transform" 
                    onClick={() => navigate('/privacy')}
                  >
                    Read our Privacy Policy
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </ParallaxSection>
        
        <Suspense fallback={<div className="py-12 text-center">Loading newsletter signup...</div>}>
          <NewsletterSignup />
        </Suspense>
        
        <Suspense fallback={<div className="py-12 text-center">Loading testimonials...</div>}>
          <Testimonials />
        </Suspense>
        
        <div id="cta-section">
          <Suspense fallback={<div className="py-12 text-center">Loading CTA section...</div>}>
            <CTASection activeSection={activeSection} />
          </Suspense>
        </div>
      </main>
      
      <Suspense fallback={<div className="py-6 text-center">Loading footer...</div>}>
        <Footer />
      </Suspense>

      {/* Sticky CTA for better mobile conversion */}
      <StickyCTA show={showStickyCTA} onClick={handleStickyCTAClick} />
    </div>
  );
};

export default Index;
