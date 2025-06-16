
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles, Star, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingCTA = () => {
  const navigate = useNavigate();

  return (
    <div className="cta-section relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-600 opacity-95 rounded-3xl"></div>
      <div className="absolute top-6 right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-6 left-6 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <CardContent className="relative z-10 text-center">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-premium">
            <Sparkles className="h-10 w-10 text-white animate-bounce-gentle" />
          </div>
        </div>
        
        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white font-display">
          Ready to Transform Your Sales Performance?
        </h3>
        
        <p className="text-white/90 mb-10 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
          Join over 15,000 sales professionals who've improved their pitch effectiveness 
          and closing rates with AI-powered practice and personalized feedback.
        </p>
        
        <div className="space-y-6">
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-white text-primary-600 hover:bg-neutral-100 font-bold shadow-premium hover:shadow-glow-lg transition-all duration-300 group text-xl px-12 py-6 h-auto"
            size="lg"
          >
            <ArrowRight className="h-6 w-6 mr-3 group-hover:translate-x-1 transition-transform" />
            View Pricing Plans
          </Button>
          
          <div className="flex items-center justify-center gap-8 text-white/90 font-medium">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-300" />
              <span>Starting at $29/month</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-300" />
              <span>7-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default PricingCTA;
