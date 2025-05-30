
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, CreditCard, User, Mail, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const Subscription: React.FC = () => {
  const { user, isPremium, creditsRemaining, trialUsed } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error accessing customer portal:', error);
      toast({
        title: 'Error',
        description: 'Unable to access subscription management. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to view your subscription details.</p>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Subscription Management | PitchPerfect AI</title>
        <meta name="description" content="Manage your PitchPerfect AI subscription and billing details." />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-dark mb-4">Subscription Management</h1>
            <p className="text-lg text-brand-dark/70">Manage your plan, billing, and account preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Status</span>
                  <Badge variant={isPremium ? "default" : "secondary"}>
                    {isPremium ? "Premium" : "Free"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Credits Remaining</span>
                  <span className="text-sm text-gray-600">{creditsRemaining}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Free Analysis Used</span>
                  <span className="text-sm text-gray-600">{trialUsed ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPremium ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-amber-700">Premium Plan Active</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      You have unlimited access to all premium features.
                    </p>
                    <Button 
                      onClick={handleManageSubscription}
                      disabled={loading}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {loading ? 'Loading...' : 'Manage Billing'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-4">
                        You're currently on the free plan. Upgrade to Premium for unlimited access to all features.
                      </p>
                      <Button onClick={handleUpgrade} className="w-full">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{trialUsed ? "1" : "0"}</div>
                    <div className="text-sm text-gray-600">Free Analysis Used</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{creditsRemaining}</div>
                    <div className="text-sm text-gray-600">Credits Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{isPremium ? "∞" : "Limited"}</div>
                    <div className="text-sm text-gray-600">Practice Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  If you have any questions about your subscription or need assistance, our support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "mailto:support@pitchperfectai.com"}
                    className="flex-1"
                  >
                    Contact Support
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/pricing')}
                    className="flex-1"
                  >
                    View All Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Subscription;
