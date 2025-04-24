
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <section className="py-12 bg-gradient-to-b from-white to-brand-blue/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-brand-dark">New! AI Roleplay Practice</h2>
              <p className="text-lg mb-8 text-brand-dark/70">
                Practice your pitch in real-time with our advanced AI roleplay system. 
                Choose between voice or text interaction and get instant feedback.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/roleplay">
                  <Button className="btn-primary flex items-center gap-2">
                    Try Roleplay Now <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/subscription">
                  <Button variant="outline" className="flex items-center gap-2">
                    Go Premium 
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
