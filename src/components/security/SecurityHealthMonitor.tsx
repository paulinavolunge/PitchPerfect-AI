
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { ServerSideValidationService } from '@/services/ServerSideValidationService';

interface SecurityMetrics {
  status: string;
  timestamp: string;
  metrics?: {
    recent_security_events: number;
    blocked_users: number;
    active_policies: number;
  };
}

export const SecurityHealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<number>(0);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const data = await ServerSideValidationService.performSecurityHealthCheck();
      setHealthData(data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthData({
        status: 'error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performCleanup = async () => {
    try {
      const cleanedCount = await ServerSideValidationService.cleanupExpiredRateLimits();
      setLastCleanup(cleanedCount);
      // Refresh health check after cleanup
      await performHealthCheck();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  useEffect(() => {
    performHealthCheck();
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(performHealthCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Shield className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Health Monitor
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={performHealthCheck}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthData && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Status:</span>
              {getStatusBadge(healthData.status)}
            </div>

            <div className="text-xs text-gray-500">
              Last checked: {new Date(healthData.timestamp).toLocaleString()}
            </div>

            {healthData.metrics && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {healthData.metrics.recent_security_events}
                  </div>
                  <div className="text-xs text-gray-600">Recent Events</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {healthData.metrics.blocked_users}
                  </div>
                  <div className="text-xs text-gray-600">Blocked Users</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {healthData.metrics.active_policies}
                  </div>
                  <div className="text-xs text-gray-600">Active Policies</div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={performCleanup}
                className="text-xs"
              >
                Cleanup Rate Limits
              </Button>
              {lastCleanup > 0 && (
                <span className="text-xs text-green-600">
                  Cleaned {lastCleanup} expired records
                </span>
              )}
            </div>
          </>
        )}

        {!healthData && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            Click refresh to check security status
          </div>
        )}
      </CardContent>
    </Card>
  );
};
