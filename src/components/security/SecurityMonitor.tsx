
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityStatus {
  rateLimited: boolean;
  recentFailures: number;
  lastActivity: string | null;
  securityScore: number;
}

const SecurityMonitor: React.FC = () => {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    rateLimited: false,
    recentFailures: 0,
    lastActivity: null,
    securityScore: 100
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const checkSecurityStatus = async () => {
      try {
        // Check rate limiting status
        const { data: rateLimitData } = await supabase
          .from('voice_rate_limits')
          .select('blocked_until, request_count')
          .eq('user_id', user.id)
          .gte('window_start', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .single();

        // Check recent security events
        const { data: securityEvents } = await supabase
          .from('security_events')
          .select('event_type, created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        const failedEvents = securityEvents?.filter(event => 
          event.event_type.includes('failed') || event.event_type.includes('exceeded')
        ).length || 0;

        const rateLimited = rateLimitData?.blocked_until && 
          new Date(rateLimitData.blocked_until) > new Date();

        const lastActivity = securityEvents?.[0]?.created_at || null;

        // Calculate security score (100 - failures * 10, minimum 0)
        const securityScore = Math.max(0, 100 - failedEvents * 10);

        setSecurityStatus({
          rateLimited: !!rateLimited,
          recentFailures: failedEvents,
          lastActivity,
          securityScore
        });
      } catch (error) {
        console.error('Failed to check security status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSecurityStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || loading) {
    return null;
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Security Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Security Score</span>
          <div className="flex items-center gap-2">
            {getSecurityScoreIcon(securityStatus.securityScore)}
            <span className={`font-semibold ${getSecurityScoreColor(securityStatus.securityScore)}`}>
              {securityStatus.securityScore}/100
            </span>
          </div>
        </div>

        {securityStatus.rateLimited && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              Rate limited - please wait before making more requests
            </AlertDescription>
          </Alert>
        )}

        {securityStatus.recentFailures > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              {securityStatus.recentFailures} security event(s) in the last 24 hours
            </AlertDescription>
          </Alert>
        )}

        {securityStatus.lastActivity && (
          <div className="text-xs text-gray-500">
            Last activity: {new Date(securityStatus.lastActivity).toLocaleTimeString()}
          </div>
        )}

        {securityStatus.securityScore === 100 && securityStatus.recentFailures === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              All security checks passed
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityMonitor;
