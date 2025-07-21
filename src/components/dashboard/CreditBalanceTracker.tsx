
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Diamond, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface CreditBalanceTrackerProps {
  className?: string;
}

const CreditBalanceTracker: React.FC<CreditBalanceTrackerProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { creditsRemaining, isPremium } = useAuth();

  const handleBuyMoreCredits = () => {
    navigate('/pricing');
  };

  // Don't show for enterprise users (unlimited credits)
  if (isPremium && creditsRemaining === -1) {
    return (
      <Card className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}>
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Diamond className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Credits Remaining</p>
              <p className="text-2xl font-bold text-green-800">Unlimited</p>
            </div>
          </div>
          <div className="text-xs text-green-700 font-medium px-3 py-1 bg-green-100 rounded-full">
            Enterprise Plan
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLowCredits = creditsRemaining < 10;
  const isOutOfCredits = creditsRemaining === 0;

  const cardStyle = isOutOfCredits 
    ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
    : isLowCredits 
    ? "border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50"
    : "border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50";

  const textColor = isOutOfCredits 
    ? "text-red-800"
    : isLowCredits 
    ? "text-orange-800"
    : "text-blue-800";

  const iconColor = isOutOfCredits 
    ? "text-red-600"
    : isLowCredits 
    ? "text-orange-600"
    : "text-blue-600";

  return (
    <Card className={`${cardStyle} shadow-sm ${className}`}>
      <CardContent className="pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Diamond className={`h-6 w-6 ${iconColor}`} />
          <div>
            <p className="text-sm text-gray-700 font-medium">Credits Remaining</p>
            <p className={`text-2xl font-bold ${textColor}`}>{creditsRemaining}</p>
          </div>
        </div>
        <Button 
          onClick={handleBuyMoreCredits}
          variant={isOutOfCredits ? "default" : "outline"}
          size="sm"
          className={`flex items-center gap-2 ${isOutOfCredits ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          <Plus className="h-4 w-4" />
          {isOutOfCredits ? "Buy Credits" : "Top Up"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreditBalanceTracker;
