
import React, { useState, useEffect } from 'react';
import { Clock, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TimeOfferProps {
  expiryDate: Date;
  discount: string;
  description: string;
  variant?: 'banner' | 'card';
  ctaText?: string;
  ctaLink?: string;
  onClose?: () => void;
}

const TimeOffer: React.FC<TimeOfferProps> = ({
  expiryDate,
  discount,
  description,
  variant = 'banner',
  ctaText = 'Get This Deal',
  ctaLink = '/pricing',
  onClose
}) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = expiryDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Update countdown immediately
    setTimeLeft(calculateTimeLeft());
    
    // Set interval to update countdown
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clear interval on unmount
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (isExpired) {
    return null;
  }

  const formatTimeValue = (value: number) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  const handleCtaClick = () => {
    navigate(ctaLink);
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white px-4 py-2 sm:px-6 sm:py-3 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center mb-2 sm:mb-0">
            <Percent className="h-5 w-5 mr-2" />
            <span className="font-medium">{description}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <div className="text-sm">
                <span className="bg-white text-orange-600 px-1 py-0.5 rounded font-mono font-bold">
                  {formatTimeValue(timeLeft.days)}d
                </span>
                <span className="mx-0.5">:</span>
                <span className="bg-white text-orange-600 px-1 py-0.5 rounded font-mono font-bold">
                  {formatTimeValue(timeLeft.hours)}h
                </span>
                <span className="mx-0.5">:</span>
                <span className="bg-white text-orange-600 px-1 py-0.5 rounded font-mono font-bold">
                  {formatTimeValue(timeLeft.minutes)}m
                </span>
                <span className="mx-0.5">:</span>
                <span className="bg-white text-orange-600 px-1 py-0.5 rounded font-mono font-bold">
                  {formatTimeValue(timeLeft.seconds)}s
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-white text-orange-600 hover:bg-orange-50 ml-2" 
              onClick={handleCtaClick}
            >
              {ctaText}
            </Button>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute right-2 top-2 text-white/80 hover:text-white"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-orange-800 text-lg">{discount}</h3>
          <p className="text-gray-700 mt-1">{description}</p>
        </div>
        <Percent className="h-6 w-6 text-orange-500" />
      </div>
      
      <div className="mt-4 bg-white p-3 rounded-md shadow-sm">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Offer ends in:</p>
        <div className="flex justify-center gap-2">
          <div className="flex flex-col items-center">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono font-bold text-xl">
              {formatTimeValue(timeLeft.days)}
            </span>
            <span className="text-xs mt-1 text-gray-500">Days</span>
          </div>
          <div className="flex items-center self-start pt-2">:</div>
          <div className="flex flex-col items-center">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono font-bold text-xl">
              {formatTimeValue(timeLeft.hours)}
            </span>
            <span className="text-xs mt-1 text-gray-500">Hours</span>
          </div>
          <div className="flex items-center self-start pt-2">:</div>
          <div className="flex flex-col items-center">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono font-bold text-xl">
              {formatTimeValue(timeLeft.minutes)}
            </span>
            <span className="text-xs mt-1 text-gray-500">Mins</span>
          </div>
          <div className="flex items-center self-start pt-2">:</div>
          <div className="flex flex-col items-center">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono font-bold text-xl">
              {formatTimeValue(timeLeft.seconds)}
            </span>
            <span className="text-xs mt-1 text-gray-500">Secs</span>
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white" 
        onClick={handleCtaClick}
      >
        {ctaText}
      </Button>
    </div>
  );
};

export default TimeOffer;
