
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingCTA = () => {
  const navigate = useNavigate();

  return (
    <Card className="modern-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-sky-blue opacity-90"></div>
      <div className="absolute top-4 right-4 w-24 h-24 bg-white/20 rounded-full blur-xl animate-gentle-float"></div>
      <div className="absolute bottom-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-gentle-float" style={{animationDelay: '1s'}}></div>
      
      <CardContent className="p-8 text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <Sparkles className="h-8 w-8 text-white animate-soft-pulse" />
          </div>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
          Ready to Master Your Sales Pitch?
        </h3>
        
        <p className="text-white/90 mb-8 max-w-md mx-auto text-lg leading-relaxed">
          Join thousands of sales professionals who've improved their pitch with AI-powered practice and feedback.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 group"
            size="lg"
          >
            <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
            View Pricing Plans
          </Button>
          
          <p className="text-sm text-white/80">
            Starting at just $29 • 7-day money-back guarantee
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCTA;
