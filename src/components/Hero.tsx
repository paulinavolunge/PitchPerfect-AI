import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="pt-24 pb-20 bg-gradient-to-b from-brand-blue/30 to-white overflow-hidden">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 space-y-6 mb-10 lg:mb-0 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-tight">
            Perfect Your <span className="text-brand-blue">Sales Pitch</span> with AI
          </h1>
          <p className="text-xl text-brand-dark/80 max-w-xl">
            Train, practice, and refine your sales pitches with real-time voice feedback and personalized AI coaching.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/practice">
              <Button className="btn-primary flex items-center gap-2 group">
                Start Practicing 
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </Link>
            <Link to="/subscription">
              <Button variant="outline" className="btn-secondary">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-sm text-brand-dark/60">
            Trusted by 10,000+ sales professionals from leading companies
          </p>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md mx-auto transform rotate-2 relative z-10 animate-scale-in">
            <div className="bg-brand-blue/10 p-4 rounded-xl mb-4 flex items-center gap-3">
              <div className="bg-brand-blue text-white p-2 rounded-md">
                <div className="w-5 h-5 animate-pulse-gentle" />
              </div>
              <span className="font-medium">Recording your pitch...</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded-full"></div>
              <div className="h-2 bg-gray-200 rounded-full w-5/6"></div>
            </div>
            <div className="mt-6 speech-bubble">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-brand-blue/20 text-brand-blue p-1 rounded-full">
                  <div className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">AI Feedback</span>
              </div>
              <p className="text-sm text-brand-dark/80">
                Try emphasizing the key benefits more and speaking 15% slower for better engagement.
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-blue opacity-20 rounded-2xl rotate-6 transform scale-95 translate-x-4 translate-y-4"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
