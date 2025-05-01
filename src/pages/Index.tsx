
import React, { useState, lazy, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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
                    <Button variant="outline" className="flex items-center gap-2" onClick={() => scrollToCTA('demo')}>
                      Book a Demo
                    </Button>
                  </>
                )}
              </div>
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
