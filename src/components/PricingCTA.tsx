
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingCTA = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-r from-brand-green to-brand-blue text-white">
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <Star className="h-8 w-8 text-yellow-300" />
        </div>
        
        <h3 className="text-2xl font-bold mb-2">
          Ready to Master Your Sales Pitch?
        </h3>
        
        <p className="text-white/90 mb-6 max-w-md mx-auto">
          Join thousands of sales professionals who've improved their pitch with AI-powered practice and feedback.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-white text-brand-green hover:bg-gray-100 font-semibold"
            size="lg"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
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
