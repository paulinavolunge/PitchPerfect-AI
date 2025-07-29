import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { saveCurrentRoute, isProtectedRoute } from '@/utils/routePersistence';

/**
 * Custom hook to track and persist route changes
 */
export const useRoutePersistence = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Only save routes when user is authenticated
    if (user) {
      // Save current route to localStorage (including search params)
      saveCurrentRoute(location.pathname, location.search);
    }
  }, [location.pathname, location.search, user]);

  // Return whether current route is protected
  return {
    isProtected: isProtectedRoute(location.pathname)
  };
};