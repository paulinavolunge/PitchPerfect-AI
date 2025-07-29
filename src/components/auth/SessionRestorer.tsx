import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLastRoute, isProtectedRoute } from '@/utils/routePersistence';

/**
 * Component to handle session restoration and routing on page refresh
 */
export const SessionRestorer = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run restoration logic after auth has loaded
    if (loading) return;

    // If user is authenticated and on a non-protected route (like login)
    if (user && !isProtectedRoute(location.pathname)) {
      const lastRoute = getLastRoute();
      
      // If we have a saved route and we're not already there
      if (lastRoute && lastRoute !== location.pathname) {
        console.log('Restoring last visited route:', lastRoute);
        navigate(lastRoute, { replace: true });
      } else if (location.pathname === '/login' || location.pathname === '/signup') {
        // If on auth pages but no saved route, go to dashboard
        console.log('Authenticated user on auth page, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
};

export default SessionRestorer;