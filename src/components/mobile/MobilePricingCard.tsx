import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, ChevronUp, Star, Zap, UserPlus, ArrowRight } from 'lucide-react';

interface MobilePricingCardProps {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  loading?: boolean;
  onPurchase: () => void;
  user?: any;
  gradient?: string;
}

const MobilePricingCard: React.FC<MobilePricingCardProps> = ({
  id,
  name,
  price,
  priceNote,
  description,
  features,
  popular = false,
  buttonText,
  loading = false,
  onPurchase,
  user,
  gradient = 'from-primary/10 to-vibrant-blue/20'
}) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 3);

  return (
    <Card className={`relative ${popular ? 'border-primary-200 shadow-lg' : ''}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white shadow-lg">
          <Star className="h-4 w-4 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl opacity-40`}></div>
      
      <CardHeader className="text-center relative z-10 pb-4">
        <CardTitle className="text-xl font-bold text-deep-navy mb-2">
          {name}
        </CardTitle>
        <div className="text-3xl font-bold text-primary-600 mb-1">{price}</div>
        <p className="text-sm text-muted-foreground">{priceNote}</p>
        <p className="text-sm text-deep-navy/80 mt-2">{description}</p>
      </CardHeader>

      <CardContent className="relative z-10 pt-0">
        <div className="space-y-3 mb-6">
          {visibleFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-deep-navy">{feature}</span>
            </div>
          ))}
          
          {features.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="w-full mt-2 h-8 text-xs"
            >
              {showAllFeatures ? (
                <>
                  Show Less <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show {features.length - 3} More Features <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>

        <Button
          onClick={onPurchase}
          disabled={loading}
          className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
            popular 
              ? 'bg-gradient-to-r from-primary-600 to-vibrant-blue-500 hover:from-primary-700 hover:to-vibrant-blue-600 text-white shadow-lg hover:shadow-xl' 
              : 'border-2 border-primary-400 text-primary-700 hover:bg-primary-50 hover:border-primary-500 bg-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              {user ? (
                <Zap className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {buttonText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MobilePricingCard;