import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGuestMode } from '@/context/GuestModeContext';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
  const { user, loading, initError } = useAuth();
  const { isGuestMode } = useGuestMode();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-brand-dark">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if auth initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-2">{initError}</p>
          <p className="text-sm text-gray-500 mb-4">
            This might be a temporary issue. Please try:
          </p>
          <ul className="text-sm text-gray-500 mb-4 text-left list-disc list-inside">
            <li>Refreshing the page</li>
            <li>Clearing your browser cache</li>
            <li>Checking your internet connection</li>
            <li>Trying a different browser</li>
          </ul>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
            <Button variant="outline" onClick={() => {
              // Clear auth data and try again
              try {
                localStorage.removeItem('sb-ggpodadyycvmmxifqwlp-auth-token');
                localStorage.removeItem('supabase.auth.token');
              } catch {}
              window.location.reload();
            }}>
              Clear Cache & Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If auth is required and user is not authenticated (and not in guest mode)
  if (requireAuth && !user && !isGuestMode) {
    return <Navigate to="/login" replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;