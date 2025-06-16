
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingCTA = () => {
  const navigate = useNavigate();

  return (
    <Card className="vibrant-card relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-vibrant-blue-500 to-primary-600 opacity-95"></div>
      <div className="absolute top-4 right-4 w-24 h-24 bg-white/20 rounded-full blur-xl animate-vibrant-float"></div>
      <div className="absolute bottom-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-vibrant-float" style={{animationDelay: '1s'}}></div>
      
      <CardContent className="p-8 text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm shadow-vibrant">
            <Sparkles className="h-8 w-8 text-white animate-strong-pulse" />
          </div>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
          Ready to Master Your Sales Pitch?
        </h3>
        
        <p className="text-white/90 mb-8 max-w-md mx-auto text-lg leading-relaxed font-medium">
          Join thousands of sales professionals who've improved their pitch with AI-powered practice and feedback.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-white text-vibrant-blue-600 hover:bg-neutral-base/90 font-bold shadow-deep hover:shadow-vibrant-xl transition-all duration-300 group text-lg px-8 py-4"
            size="lg"
          >
            <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
            View Pricing Plans
          </Button>
          
          <p className="text-sm text-white/80 font-medium">
            Starting at just $29 • 7-day money-back guarantee
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCTA;
