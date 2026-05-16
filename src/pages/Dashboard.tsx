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
import MobileBottomBar from '@/components/layout/MobileBottomBar';

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

      {/* Sticky bottom action bar — mobile only, hides on keyboard focus */}
      <MobileBottomBar onStartPractice={handleStartPractice} />

      {/* pb-24 on mobile creates clearance above the MobileBottomBar (56px pill + 8px gap) */}
      <main className="flex-grow pt-20 pb-24 md:pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
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
            /*
              Mobile-first block order (CSS flex order):
                order-1 / md:order-1  AICoachingCard — personalised, highest engagement
                order-2 / md:order-2  StatsStrip      — quick performance numbers
                order-3 / md:order-3  RecentRoundsList
                order-4 / md:order-4  Upgrade CTA     — commercial, lowest urgency
            */
            <div className="flex flex-col">
              {/* AICoachingCard: mobile=1st, desktop=1st (everyone benefits) */}
              <div className="order-1 mb-6">
                <AICoachingCard />
              </div>

              {/* StatsStrip: mobile=2nd, desktop=2nd */}
              <div className="order-2">
                <StatsStrip />
              </div>

              {/* Recent Rounds: mobile=3rd, desktop=3rd */}
              <div className="order-3 mb-6">
                <RecentRoundsList onStartPractice={handleStartPractice} />
              </div>

              {/* Upgrade CTA: mobile=4th (least priority), desktop=4th */}
              {!isPremium && isPricingEnabled() && (
                <div className="order-4 mb-6">
                  <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            Upgrade to Pro
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Round packs or unlimited — pick your pace.
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">Free plan</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Starter */}
                        <div className="bg-white rounded-xl border border-border p-4 flex flex-col">
                          <p className="font-semibold text-sm mb-1">Starter</p>
                          <p className="text-xl font-bold mb-2">$4.99 <span className="text-xs font-normal text-muted-foreground">one-time</span></p>
                          <ul className="text-xs text-muted-foreground space-y-1 mb-3 flex-grow">
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />Full scorecard</li>
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />5 rounds</li>
                          </ul>
                          <Button onClick={() => goToCheckout(STRIPE_STARTER_URL)} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs min-h-[44px]">
                            Get Starter — $4.99
                          </Button>
                        </div>
                        {/* Power */}
                        <div className="bg-white rounded-xl border-2 border-blue-600 p-4 relative flex flex-col">
                          <Badge className="absolute -top-2.5 left-3 bg-blue-600 text-white text-[10px] px-2 py-0.5">Best Value</Badge>
                          <p className="font-semibold text-sm mb-1">Power</p>
                          <p className="text-xl font-bold mb-2">$9.99 <span className="text-xs font-normal text-muted-foreground">one-time</span></p>
                          <ul className="text-xs text-muted-foreground space-y-1 mb-3 flex-grow">
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />Full scorecard</li>
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />15 rounds</li>
                          </ul>
                          <Button onClick={() => goToCheckout(STRIPE_POWER_URL)} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs min-h-[44px]">
                            Get Power — $9.99
                          </Button>
                        </div>
                        {/* Unlimited */}
                        <div className="bg-white rounded-xl border border-border p-4 flex flex-col">
                          <p className="font-semibold text-sm mb-1">Unlimited</p>
                          <p className="text-xl font-bold mb-2">$29<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                          <ul className="text-xs text-muted-foreground space-y-1 mb-3 flex-grow">
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />Unlimited rounds</li>
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />All scenarios</li>
                            <li className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600 shrink-0" />Cancel anytime</li>
                          </ul>
                          <Button onClick={() => goToCheckout(STRIPE_UNLIMITED_URL)} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs min-h-[44px]">
                            Go unlimited — $29/mo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          </>)}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
