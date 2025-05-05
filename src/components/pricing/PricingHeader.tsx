
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PricingHeaderProps {
  planType: "monthly" | "yearly";
  setPlanType: (value: "monthly" | "yearly") => void;
}

const PricingHeader: React.FC<PricingHeaderProps> = ({ planType, setPlanType }) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-4">Simple, Transparent Pricing</h1>
      <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
        Choose the plan that's right for you and start improving your sales conversations today.
      </p>
      
      <div className="mt-8 max-w-xs mx-auto">
        <Tabs 
          value={planType} 
          onValueChange={(v) => setPlanType(v as "monthly" | "yearly")}
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="monthly" className="text-sm">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="text-sm">Yearly (Save 17%)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default PricingHeader;
