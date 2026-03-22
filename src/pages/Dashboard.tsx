import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Play, BarChart3, CreditCard, Crown, Lightbulb, Infinity, Zap, Users, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { useGuestMode } from '@/context/GuestModeContext';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import RecentSessions from '@/components/dashboard/RecentSessions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isPricingEnabled } from '@/config/features';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGuestMode } = useGuestMode();
  const {
    user,
    isPremium,
    creditsRemaining,
    refreshSubscription,
  } = useAuth();

  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();

  const handleCheckout = async (planId: string, quantity: number = 1) => {
    setCheckoutLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productType: planId, quantity },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  const handleStartPractice = () => {
    if (!isPremium && (creditsRemaining ?? 0) === 0) {
      handleCheckout('solo');
      return;
    }
    navigate('/roleplay');
  };

  const sessionCount = dashboardData?.stats?.totalSessions || 0;
  const averageScore = dashboardData?.stats?.averageScore;
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>Dashboard | PitchPerfect AI</title>
        <meta name="description" content="Track your pitch practice progress and improve your sales skills with AI-powered feedback." />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Hey, {firstName} 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                {sessionCount === 0
                  ? "Ready to start your first practice session?"
                  : `You've completed ${sessionCount} session${sessionCount !== 1 ? 's' : ''} so far.`}
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              onClick={handleStartPractice}
            >
              <Play className="h-5 w-5 mr-2" />
              Start Practice
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-destructive">{error}</span>
                <Button onClick={refetch} variant="outline" size="sm" className="ml-4">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* No credits warning */}
          {!isPremium && (creditsRemaining ?? 0) === 0 && !isLoading && (
            <Alert className="mb-6 border-amber-300 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-amber-800">You have no credits remaining. Upgrade to continue practicing.</span>
                {isPricingEnabled() && (
                  <Button onClick={() => handleCheckout('solo')} disabled={checkoutLoading === 'solo'} variant="outline" size="sm" className="ml-4 border-amber-400 text-amber-800 hover:bg-amber-100">
                    {checkoutLoading === 'solo' ? 'Processing...' : 'Upgrade to Pro — $29/mo'}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{sessionCount}</div>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {averageScore != null ? `${Math.round(averageScore)}%` : '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {averageScore != null ? 'across sessions' : 'no scores yet'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground flex items-center gap-1">
                      {isPremium ? (
                        <Infinity className="h-6 w-6" />
                      ) : (
                        creditsRemaining ?? 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isPremium ? 'unlimited' : 'remaining'}
                    </p>
                  </CardContent>
                </Card>

                <Card className={!isPremium ? 'border-blue-200' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
                    <Crown className={`h-4 w-4 ${isPremium ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    {isPremium ? (
                      <>
                        <div className="text-2xl font-bold text-foreground">Premium</div>
                        <p className="text-xs text-muted-foreground">active</p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">Free</div>
                        <p className="text-xs text-muted-foreground mb-2">3 sessions/month</p>
                        {isPricingEnabled() && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckout('solo')}
                            disabled={checkoutLoading === 'solo'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                          >
                            {checkoutLoading === 'solo' ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />...</> : 'Upgrade — $29/mo'}
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upgrade CTA for free users */}
              {!isPremium && isPricingEnabled() && (
                <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          Upgrade to Pro
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Unlock unlimited practice sessions, custom scenarios, and detailed analytics.
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        Current: Free
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Solo Plan */}
                      <div className="bg-white rounded-xl border border-border p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-foreground">Solo</h3>
                        </div>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-foreground">$29</span>
                          <span className="text-muted-foreground">/mo</span>
                        </div>
                        <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Unlimited sessions</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />AI scoring & feedback</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />All objection scenarios</li>
                        </ul>
                        <Button
                          onClick={() => handleCheckout('solo')}
                          disabled={checkoutLoading === 'solo'}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {checkoutLoading === 'solo' ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Processing...</> : 'Get Solo — $29/mo'}
                        </Button>
                      </div>
                      {/* Team Plan */}
                      <div className="bg-white rounded-xl border-2 border-blue-600 p-5 relative">
                        <Badge className="absolute -top-2.5 left-4 bg-blue-600 text-white text-xs px-2 py-0.5">Best Value</Badge>
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-foreground">Team</h3>
                        </div>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-foreground">$49</span>
                          <span className="text-muted-foreground">/seat/mo</span>
                        </div>
                        <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Everything in Solo</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Team analytics dashboard</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Shared leaderboards</li>
                        </ul>
                        <Button
                          onClick={() => handleCheckout('team', 3)}
                          disabled={checkoutLoading === 'team'}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {checkoutLoading === 'team' ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Processing...</> : 'Get Team — $49/seat/mo'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Sessions */}
              <div className="mb-8">
                <RecentSessions
                  sessions={dashboardData?.recentSessions || []}
                  onStartPractice={handleStartPractice}
                />
              </div>

              {/* Quick Tips - only shown after user has sessions */}
              {sessionCount > 0 && dashboardData?.tips && dashboardData.tips.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Quick Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {dashboardData.tips.slice(0, 3).map((tip) => (
                        <li key={tip.id} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <div>
                            <p className="font-medium text-sm text-foreground">{tip.title}</p>
                            <p className="text-xs text-muted-foreground">{tip.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
