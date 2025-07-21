import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityValidationService } from '@/services/SecurityValidationService';
import { EnhancedRateLimitService } from '@/services/EnhancedRateLimitService';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}

interface SecurityMetrics {
  rateLimitStatus: {
    voice_processing: number;
    file_upload: number;
    api_call: number;
    content_generation: number;
  };
  recentEvents: any[];
  adminStatus: boolean;
}

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSecurityData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load security health status
      const healthCheck = await SecurityValidationService.performSecurityHealthCheck();
      setSecurityStatus(healthCheck);

      // Load security metrics
      const metrics: SecurityMetrics = {
        rateLimitStatus: {
          voice_processing: EnhancedRateLimitService.getRemainingRequests('voice_processing'),
          file_upload: EnhancedRateLimitService.getRemainingRequests('file_upload'),
          api_call: EnhancedRateLimitService.getRemainingRequests('api_call'),
          content_generation: EnhancedRateLimitService.getRemainingRequests('content_generation'),
        },
        recentEvents: [],
        adminStatus: false
      };

      // Check admin status
      const { data: isAdmin } = await supabase.rpc('is_verified_admin');
      metrics.adminStatus = !!isAdmin;

      // Load recent security events (if admin)
      if (isAdmin) {
        const { data: events } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        metrics.recentEvents = events || [];
      }

      setSecurityMetrics(metrics);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <Shield className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const clearRateLimits = () => {
    EnhancedRateLimitService.clearRateLimits();
    loadSecurityData();
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Please log in to view security dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSecurityData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {securityStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(securityStatus.status)}
                <Badge className={getStatusColor(securityStatus.status)}>
                  {securityStatus.status.toUpperCase()}
                </Badge>
              </div>

              {securityStatus.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issues Found:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {securityStatus.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {securityStatus.recommendations.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {securityStatus.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p>Loading security status...</p>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting Status */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting Status</CardTitle>
        </CardHeader>
        <CardContent>
          {securityMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(securityMetrics.rateLimitStatus).map(([action, remaining]) => (
                <div key={action} className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-primary">{remaining}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {action.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">remaining</div>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading rate limit data...</p>
          )}

          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={clearRateLimits}>
              Reset Rate Limits (Testing)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Security Events */}
      {securityMetrics?.adminStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            {securityMetrics.recentEvents.length > 0 ? (
              <div className="space-y-2">
                {securityMetrics.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline">{event.event_type}</Badge>
                      <span className="ml-2 text-sm">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    {event.user_id && (
                      <span className="text-xs text-muted-foreground">
                        User: {event.user_id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent security events.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};