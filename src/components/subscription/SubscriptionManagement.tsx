
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface SubscriptionManagementProps {
  onUpgradeClick: () => void;
}

const billingSchema = z.object({
  cardName: z.string().min(2, { message: "Name is required" }),
  cardNumber: z.string().min(16, { message: "Valid card number is required" }),
  expiry: z.string().min(5, { message: "Valid expiry date is required" }),
  cvc: z.string().min(3, { message: "Valid CVC is required" }),
});

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ onUpgradeClick }) => {
  const [activeTab, setActiveTab] = useState("subscription");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<z.infer<typeof billingSchema>>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
    },
  });

  const onSubmit = (values: z.infer<typeof billingSchema>) => {
    console.log(values);
    setIsDialogOpen(false);
    onUpgradeClick();
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription">Current Plan</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Current Plan</CardTitle>
              <CardDescription>
                You are currently on the Free plan with limited features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Free Plan Features:</h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center text-sm">
                    <span className="bg-green-100 rounded-full p-1 mr-2">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </span>
                    Basic roleplay scenarios
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="bg-green-100 rounded-full p-1 mr-2">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </span>
                    Voice interaction
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="bg-green-100 rounded-full p-1 mr-2">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </span>
                    Basic feedback
                  </li>
                </ul>
              </div>
              
              <div>
                <p className="text-sm mb-4">
                  Unlock all features by upgrading to our Premium plan.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto bg-brand-green hover:bg-brand-green/90">
                      Upgrade to Premium
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Upgrade to Premium</DialogTitle>
                      <DialogDescription>
                        Enter your payment details to upgrade to our Premium plan.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="cardName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name on Card</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input placeholder="4242 4242 4242 4242" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="expiry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <FormControl>
                                  <Input placeholder="MM/YY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cvc"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVC</FormLabel>
                                <FormControl>
                                  <Input placeholder="123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green/90">
                          Subscribe Now
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your billing details and payment methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Payment Method</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No payment methods available
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Billing Address</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No billing address available
                  </p>
                </div>
                
                <Button className="w-full md:w-auto" variant="outline">
                  Update Billing Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View your previous payments and invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManagement;

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

