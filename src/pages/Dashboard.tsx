import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Zap, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { useGuestMode } from '@/context/GuestModeContext';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import RecentRoundsList from '@/components/rounds/RecentRoundsList';
import StatsStrip from '@/components/dashboard/StatsStrip';
import DashboardHero from '@/components/dashboard/DashboardHero';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isPricingEnabled } from '@/config/features';
import { Badge } from '@/components/ui/badge';
import AICoachingCard from '@/components/dashboard/AICoachingCard';
import FirstRoundEmptyState from '@/components/dashboard/FirstRoundEmptyState';
import { useRoundStats } from '@/hooks/useRoundStats';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';

const STRIPE_STARTER_URL = 'https://buy.stripe.com/cNifZjcsR2YadjI68W5sA00';
const STRIPE_POWER_URL = 'https://buy.stripe.com/14AfZjboN9myenM2WK5sA01';
const STRIPE_UNLIMITED_URL = 'https://buy.stripe.com/14A14pakJ7eq4NceFs5sA02';

const Dashboard = () => {
  useOnboardingGate(); // redirect to /onboarding when profile.role is NULL
  const navigate = useNavigate();
  const { isGuestMode } = useGuestMode();
  const {
    user,
    isPremium,
    creditsRemaining,
    refreshSubscription,
  } = useAuth();

  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();
  const { stats: roundStats, isLoading: roundStatsLoading } = useRoundStats();

  const goToCheckout = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  const handleStartPractice = () => {
    if (!isPremium && (creditsRemaining ?? 0) === 0) {
      goToCheckout(STRIPE_STARTER_URL);
      return;
    }
    navigate('/practice');
  };

  const sessionCount = dashboardData?.stats?.totalSessions || 0;
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>Dashboard | PitchPerfect AI</title>
        <meta name="description" content="Track your rounds and sharpen your close with AI-powered feedback." />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* First-round empty state — full replacement when user has no scored rounds */}
          {!isLoading && !roundStatsLoading && roundStats.scoredCount === 0 && (
            <FirstRoundEmptyState />
          )}

          {/* Normal dashboard — only shown after at least one scored round */}
          {(isLoading || roundStatsLoading || roundStats.scoredCount > 0) && (
          <>
          {/* Hero */}
          <DashboardHero firstName={firstName} onStartPractice={handleStartPractice} />

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
                  <Button onClick={() => goToCheckout(STRIPE_UNLIMITED_URL)} variant="outline" size="sm" className="ml-4 border-amber-400 text-amber-800 hover:bg-amber-100">
                    Upgrade to Pro — $29/mo
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Performance stats strip — Avg Score, Rounds This Week, Weakest Area */}
              <StatsStrip />

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
                          Pick a round pack or go unlimited.
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        Current: Free
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Starter Pack */}
                      <div className="bg-white rounded-xl border border-border p-5 flex flex-col">
                        <h3 className="font-semibold text-foreground mb-2">Starter</h3>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-foreground">$4.99</span>
                          <span className="text-muted-foreground text-sm"> one-time</span>
                        </div>
                        <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground flex-grow">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Full scorecard unlocked</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />5 practice rounds</li>
                        </ul>
                        <Button
                          onClick={() => goToCheckout(STRIPE_STARTER_URL)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Unlock Scorecard + 5 Rounds — $4.99
                        </Button>
                      </div>

                      {/* Power Pack */}
                      <div className="bg-white rounded-xl border-2 border-blue-600 p-5 relative flex flex-col">
                        <Badge className="absolute -top-2.5 left-4 bg-blue-600 text-white text-xs px-2 py-0.5">Best Value</Badge>
                        <h3 className="font-semibold text-foreground mb-2">Power</h3>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-foreground">$9.99</span>
                          <span className="text-muted-foreground text-sm"> one-time</span>
                        </div>
                        <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground flex-grow">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Full scorecard unlocked</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />15 practice rounds</li>
                        </ul>
                        <Button
                          onClick={() => goToCheckout(STRIPE_POWER_URL)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Get 15 rounds — $9.99
                        </Button>
                      </div>

                      {/* Unlimited */}
                      <div className="bg-white rounded-xl border border-border p-5 flex flex-col">
                        <h3 className="font-semibold text-foreground mb-2">Unlimited</h3>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-foreground">$29</span>
                          <span className="text-muted-foreground">/mo</span>
                        </div>
                        <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground flex-grow">
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Unlimited rounds</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />All objection scenarios</li>
                          <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-600 shrink-0" />Cancel anytime</li>
                        </ul>
                        <Button
                          onClick={() => goToCheckout(STRIPE_UNLIMITED_URL)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Go unlimited — $29/mo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Rounds — self-contained with status filtering */}
              <div className="mb-8">
                <RecentRoundsList onStartPractice={handleStartPractice} />
              </div>

              {/* AI Coaching Card — most recent scored round with inline suggestions */}
              <div className="mb-8">
                <AICoachingCard />
              </div>
            </>
          )}
          </>)}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
