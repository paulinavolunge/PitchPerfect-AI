
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const { user, isPremium } = useAuth();
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();
  
  const handleUpgradeClick = () => {
    if (!user) {
      navigate('/login', { state: { from: '/subscription' } });
      return;
    }
    navigate('/subscription');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-brand-dark mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
              Choose the plan that's right for you and start improving your sales conversations today.
            </p>
            
            <div className="mt-8 max-w-xs mx-auto">
              <Tabs value={planType} onValueChange={(v) => setPlanType(v as "monthly" | "yearly")}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="monthly" className="text-sm">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-sm">Yearly (Save 17%)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Free Plan</CardTitle>
                <CardDescription>Get started with basic features</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500 ml-2">forever</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Basic sales practice tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Limited AI tips and feedback</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Progress tracking dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Community support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                {!user ? (
                  <Button className="w-full" variant="outline" onClick={() => navigate('/signup')}>
                    Sign up free
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" onClick={() => navigate('/dashboard')} disabled={isPremium}>
                    Current plan
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Premium Plan */}
            <Card className="border-2 border-brand-green shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <span className="bg-brand-green/20 text-brand-green text-xs font-medium px-2 py-1 rounded">RECOMMENDED</span>
                </div>
                <CardDescription>All features unlocked</CardDescription>
                <div className="mt-4">
                  {planType === "monthly" ? (
                    <>
                      <span className="text-4xl font-bold">$9.99</span>
                      <span className="text-gray-500 ml-2">/ month</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">$99</span>
                      <span className="text-gray-500 ml-2">/ year</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>All free plan features</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span><strong>AI roleplay practice</strong> with voice or text</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Detailed performance analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Unlimited AI tips and suggestions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                {!user ? (
                  <Button onClick={() => navigate('/signup')} className="w-full bg-brand-green hover:bg-brand-green/90">
                    {planType === "monthly" ? "Start Monthly Plan" : "Start Yearly Plan"} 
                  </Button>
                ) : (
                  <Button onClick={handleUpgradeClick} className="w-full bg-brand-green hover:bg-brand-green/90">
                    {isPremium ? "Manage Subscription" : `Upgrade to ${planType === "monthly" ? "Monthly" : "Yearly"} Premium`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-brand-dark/70">
              All plans include a 14-day free trial. No credit card required until trial ends.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
