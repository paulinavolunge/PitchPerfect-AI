import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
interface PlanFeature {
  name: string;
  highlight?: boolean;
}
interface EnterpriseSize {
  name: string;
  price: string;
  users: string;
  features: string[];
}
interface PricingPlanCardProps {
  type: 'solo' | 'team' | 'enterprise';
  title: string;
  description: string;
  price: string | React.ReactNode;
  priceDescription?: string;
  features: PlanFeature[];
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  buttonAction: () => void;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  disabled?: boolean;
  enterpriseProps?: {
    sizes: {
      small: EnterpriseSize;
      medium: EnterpriseSize;
      large: EnterpriseSize;
    };
    enterpriseSize: "small" | "medium" | "large";
    setEnterpriseSize: (size: "small" | "medium" | "large") => void;
  };
}
const PricingPlanCard: React.FC<PricingPlanCardProps> = ({
  type,
  title,
  description,
  price,
  priceDescription,
  features,
  buttonText,
  buttonVariant = 'default',
  buttonAction,
  isCurrentPlan = false,
  isPopular = false,
  disabled = false,
  enterpriseProps
}) => {
  const selectedEnterprisePlan = enterpriseProps && enterpriseProps.sizes[enterpriseProps.enterpriseSize];
  return <Card className={`border-2 ${isPopular ? 'border-brand-green shadow-lg' : 'shadow-sm'}`}>
      <CardHeader className="pb-2">
        {type !== 'enterprise' ? <>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{title}</CardTitle>
              {isPopular && <span className="bg-brand-green/20 text-brand-green text-xs font-medium px-2 py-1 rounded">POPULAR</span>}
              {isCurrentPlan && <span className="bg-brand-green/20 text-brand-green text-xs font-medium px-2 py-1 rounded">CURRENT</span>}
            </div>
            <CardDescription>{description}</CardDescription>
            <div className="mt-4">
              {price}
              {priceDescription && <span className="text-gray-500 ml-2">{priceDescription}</span>}
            </div>
          </> : <>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <div className="mt-4 mb-2">
              <Tabs value={enterpriseProps?.enterpriseSize} onValueChange={v => enterpriseProps?.setEnterpriseSize(v as "small" | "medium" | "large")} className="w-full">
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="small" className="text-xs">Small</TabsTrigger>
                  <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
                  <TabsTrigger value="large" className="text-xs">Large</TabsTrigger>
                </TabsList>
              </Tabs>
              {selectedEnterprisePlan && <div className="text-center">
                  <span className="text-xl font-semibold">{selectedEnterprisePlan.name}</span>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{selectedEnterprisePlan.price}</span>
                    <span className="text-gray-500 ml-2">/ month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedEnterprisePlan.users} users
                  </p>
                </div>}
            </div>
          </>}
      </CardHeader>
      <CardContent className={type === 'enterprise' ? 'pt-4' : 'pt-6'}>
        <ul className="space-y-3">
          {type !== 'enterprise' ? features.map((feature, index) => <li key={index} className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span className={feature.highlight ? 'font-medium' : ''}>{feature.name}</span>
              </li>) : selectedEnterprisePlan?.features.map((feature, index) => <li key={index} className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>{feature}</span>
              </li>)}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant={buttonVariant} onClick={buttonAction} disabled={disabled || isCurrentPlan && type !== 'team'} className="text-slate-300 bg-slate-200 hover:bg-slate-100 rounded-none">
          {buttonText}
        </Button>
        
        {type === 'enterprise' && <p className="text-xs text-center text-muted-foreground mt-2">
            Custom pricing and features available upon request
          </p>}
      </CardFooter>
    </Card>;
};
export default PricingPlanCard;