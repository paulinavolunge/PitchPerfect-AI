import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Zap, Users, Building2, Minus, Plus, Shield, RotateCcw, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [teamSeats, setTeamSeats] = useState(3);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePurchase = async (planId: string, quantity?: number) => {
    if (!user) {
      navigate(`/signup?plan=${planId}`);
      return;
    }

    setLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productType: planId, quantity: quantity || 1 },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const soloFeatures = [
    'Unlimited practice sessions',
    'Text & voice roleplay',
    'AI scoring & feedback',
    'Progress tracking',
    'All objection scenarios',
    'Email support',
  ];

  const teamFeatures = [
    'Everything in Solo',
    'Team analytics dashboard',
    'Manager performance view',
    'Custom team scenarios',
    'Shared leaderboards',
    'Priority support',
  ];

  const enterpriseFeatures = [
    'Everything in Team',
    'Unlimited seats',
    'Custom AI training scenarios',
    'SSO & advanced security',
    'CRM integrations',
    'Dedicated success manager',
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - PitchPerfect AI</title>
        <meta name="description" content="Choose the perfect plan for your sales training. Solo, Team, or Enterprise — all with unlimited AI roleplay." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Less Than One Lost Commission.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Your first session is free. After that, invest less than the price of a lunch meeting.
              </p>
              <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-1.5 text-sm font-medium">
                Cancel anytime · Free first session on all plans
              </Badge>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
              {/* Solo */}
              <Card className="border bg-card">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">Solo</CardTitle>
                  <p className="text-sm text-muted-foreground">For individual sales reps</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">$29</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {soloFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePurchase('solo')}
                    disabled={loading === 'solo'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {loading === 'solo' ? 'Processing...' : 'Start Free, Then $29/mo →'}
                  </Button>
                </CardContent>
              </Card>

              {/* Team */}
              <Card className="border-2 border-blue-600 bg-card relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1">
                  Best Value
                </Badge>
                <CardHeader className="text-center pt-8">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">Team</CardTitle>
                  <p className="text-sm text-muted-foreground">For managers & sales teams</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">$49</span>
                    <span className="text-muted-foreground">/seat/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">3 seat minimum</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {teamFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Seat selector */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mb-4">
                    <span className="text-sm font-medium text-foreground">Seats</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTeamSeats(Math.max(3, teamSeats - 1))}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        aria-label="Decrease seats"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-lg font-bold text-foreground w-8 text-center">{teamSeats}</span>
                      <button
                        onClick={() => setTeamSeats(teamSeats + 1)}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        aria-label="Increase seats"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Total: <span className="font-bold text-foreground">${teamSeats * 49}/mo</span>
                  </p>

                  <Button
                    onClick={() => handlePurchase('team', teamSeats)}
                    disabled={loading === 'team'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {loading === 'team' ? 'Processing...' : 'Contact for Team Access'}
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="border bg-card">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">Enterprise</CardTitle>
                  <p className="text-sm text-muted-foreground">For large organizations</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">Custom</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">tailored pricing</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {enterpriseFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => {
                      window.location.href = 'mailto:hello@pitchperfectai.ai?subject=Enterprise Plan Inquiry';
                    }}
                    variant="outline"
                    className="w-full font-semibold border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                7-day money-back guarantee
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Secure payments via Stripe
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
