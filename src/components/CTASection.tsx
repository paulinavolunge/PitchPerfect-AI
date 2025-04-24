import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const features = [
  "Real-time voice analysis",
  "Personalized improvement tips",
  "Progress tracking dashboard",
  "AI-powered feedback"
];

const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-dark to-black text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to perfect your <span className="text-brand-blue">sales pitch</span>?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of sales professionals who are closing more deals with PitchPerfect AI.
            </p>
            
            <ul className="space-y-3 mb-10">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-brand-green min-w-[20px]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex flex-wrap gap-4">
              <Button className="btn-primary">Start Free Trial</Button>
              <Button variant="outline" className="text-white border-white hover:bg-white/10">
                Book a Demo
              </Button>
            </div>
          </div>
          
          <div className="bg-brand-dark/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
            <h3 className="text-2xl font-medium mb-2 text-brand-blue">Try PitchPerfect AI Today</h3>
            <p className="text-white/80 mb-6">
              Start your 14-day free trial. No credit card required.
            </p>
            
            <form className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <input 
                  type="email" 
                  placeholder="Work Email" 
                  className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Company Name" 
                  className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <Button className="btn-primary w-full">Get Started</Button>
            </form>
            <p className="text-white/60 text-sm mt-4 text-center">
              By signing up, you agree to our Terms and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
