import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AlertCircle, Play, BarChart3, CreditCard, Crown, Lightbulb, Infinity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { useGuestMode } from '@/context/GuestModeContext';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import RecentSessions from '@/components/dashboard/RecentSessions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isPricingEnabled } from '@/config/features';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGuestMode } = useGuestMode();
  const {
    user,
    isPremium,
    creditsRemaining,
    refreshSubscription,
  } = useAuth();

  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  const handleStartPractice = () => {
    if (!isPremium && (creditsRemaining ?? 0) === 0) {
      navigate('/pricing');
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
                  <Button onClick={() => navigate('/pricing')} variant="outline" size="sm" className="ml-4 border-amber-400 text-amber-800 hover:bg-amber-100">
                    View Plans
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

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
                    <Crown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {isPremium ? 'Premium' : 'Free'}
                    </div>
                    {!isPremium && isPricingEnabled() && (
                      <button
                        onClick={() => navigate('/pricing')}
                        className="text-xs text-primary hover:underline"
                      >
                        Upgrade →
                      </button>
                    )}
                    {isPremium && (
                      <p className="text-xs text-muted-foreground">active</p>
                    )}
                  </CardContent>
                </Card>
              </div>

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
