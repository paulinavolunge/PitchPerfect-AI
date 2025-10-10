
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { InfoIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ROICalculator = () => {
  const [monthlyQuota, setMonthlyQuota] = useState<string>('10000');
  const [winRateLift, setWinRateLift] = useState<string>('5');
  const [asp, setAsp] = useState<string>('5000');
  const [roi, setRoi] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [quotaType, setQuotaType] = useState<"monthly" | "quarterly">("monthly");

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate ROI whenever inputs change
  useEffect(() => {
    // Get numeric values (or default to 0 if invalid)
    const quotaValue = parseFloat(monthlyQuota) || 0;
    const winRateValue = parseFloat(winRateLift) || 0;
    const aspValue = parseFloat(asp) || 0;

    // Trigger animation
    setIsCalculating(true);
    
    // Delay calculation a bit for animation effect
    const timer = setTimeout(() => {
      // Calculate ROI: Monthly quota * win rate increase (%) * average selling price
      // If quarterly, divide by 3 to get monthly equivalent
      const adjustedQuota = quotaType === "quarterly" ? quotaValue / 3 : quotaValue;
      const calculatedRoi = adjustedQuota * (winRateValue / 100) * aspValue;
      setRoi(calculatedRoi);
      setIsCalculating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [monthlyQuota, winRateLift, asp, quotaType]);

  // Handle input validation to only allow numbers
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    // Allow numbers and empty strings only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  return (
    <Card className="p-6 shadow-md bg-white dark:bg-gray-800 relative">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-brand-dark mb-2">ROI Calculator</h2>
        <p className="text-gray-600 dark:text-gray-300">
          See how much additional revenue PitchPerfect AI can help your team generate
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="quota-type" className="flex items-center gap-2">
              Quota Type
              <Dialog>
                <DialogTrigger>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quota Type</DialogTitle>
                    <DialogDescription>
                      Select whether your quota is monthly or quarterly. Quarterly amounts will be automatically divided by 3 to calculate the monthly impact.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </Label>
            <ToggleGroup 
              type="single" 
              value={quotaType} 
              onValueChange={(value) => value && setQuotaType(value as "monthly" | "quarterly")}
              className="border rounded-md"
            >
              <ToggleGroupItem value="monthly" className="text-xs px-3">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="quarterly" className="text-xs px-3">Quarterly</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Label htmlFor="monthly-quota" className="flex items-center gap-2">
            {quotaType === "monthly" ? "Monthly Quota" : "Quarterly Quota"}
            <Dialog>
              <DialogTrigger>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{quotaType === "monthly" ? "Monthly Quota" : "Quarterly Quota"}</DialogTitle>
                  <DialogDescription>
                    Your sales team's total {quotaType === "monthly" ? "monthly" : "quarterly"} revenue target. This is the amount your team aims to sell each {quotaType === "monthly" ? "month" : "quarter"}.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <Input
              id="monthly-quota"
              type="text"
              inputMode="numeric"
              className="pl-8"
              value={monthlyQuota}
              onChange={(e) => handleNumericInput(e, setMonthlyQuota)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="win-rate-lift" className="flex items-center gap-2">
            Win Rate Increase
            <Dialog>
              <DialogTrigger>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Win Rate Increase</DialogTitle>
                  <DialogDescription>
                    The expected percentage increase in your sales team's win rate after using PitchPerfect AI. Our customers typically see 5-15% improvement.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Label>
          <div className="relative mt-1">
            <Input
              id="win-rate-lift"
              type="text"
              inputMode="numeric"
              className="pr-8"
              value={winRateLift}
              onChange={(e) => handleNumericInput(e, setWinRateLift)}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
          </div>
        </div>

        <div>
          <Label htmlFor="avg-selling-price" className="flex items-center gap-2">
            Average Deal Size
            <Dialog>
              <DialogTrigger>
                <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Average Deal Size</DialogTitle>
                  <DialogDescription>
                    The average value of each sale your team closes. This is the typical revenue generated from one successful deal.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </Label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <Input
              id="avg-selling-price"
              type="text"
              inputMode="numeric"
              className="pl-8"
              value={asp}
              onChange={(e) => handleNumericInput(e, setAsp)}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Estimated Additional Monthly Revenue</h3>
          <div className={`mt-2 transition-all duration-500 ${isCalculating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            <span className="text-4xl font-bold text-brand-green">{formatCurrency(roi)}</span>
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">/ month</span>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Return on investment based on your inputs
          </p>
        </div>
        
        {/* Sticky CTA inside the ROI calculator */}
        <div className="mt-6 sticky-roi-cta">
          <Link to="/signup">
            <Button 
              className="w-full bg-brand-green hover:bg-brand-green/90 text-white py-6 h-auto text-lg font-medium shadow-lg"
            >
              Start Free Trial Now
            </Button>
          </Link>
          <p className="text-xs text-center mt-2 text-gray-500">No credit card required</p>
        </div>
      </div>
    </Card>
  );
};

export default ROICalculator;
