/**
 * Route persistence utilities for maintaining user navigation state
 * across sessions and page refreshes
 */

const ROUTE_STORAGE_KEY = 'lastVisitedRoute';
const INTENDED_ROUTE_KEY = 'intendedRoute';
const ROUTE_TIMESTAMP_KEY = 'routeTimestamp';
const MAX_ROUTE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface RouteState {
  path: string;
  timestamp: number;
}

/**
 * Save the current route to localStorage
 */
export const saveCurrentRoute = (path: string, search?: string): void => {
  // Don't save auth-related routes or error pages
  const excludedPaths = ['/login', '/signup', '/password-reset', '/update-password', '/email-confirmed', '/404'];
  
  if (excludedPaths.some(excluded => path.startsWith(excluded))) {
    return;
  }

  try {
    const fullPath = search ? `${path}${search}` : path;
    const routeState: RouteState = {
      path: fullPath,
      timestamp: Date.now()
    };
    
    localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routeState));
    console.log('Route saved:', fullPath);
  } catch (error) {
    console.warn('Failed to save route:', error);
  }
};

/**
 * Save the intended route (where user wanted to go before being redirected to login)
 */
export const saveIntendedRoute = (path: string, search?: string): void => {
  try {
    const fullPath = search ? `${path}${search}` : path;
    const routeState: RouteState = {
      path: fullPath,
      timestamp: Date.now()
    };
    
    localStorage.setItem(INTENDED_ROUTE_KEY, JSON.stringify(routeState));
    console.log('Intended route saved:', fullPath);
  } catch (error) {
    console.warn('Failed to save intended route:', error);
  }
};

/**
 * Get the last visited route
 */
export const getLastRoute = (): string | null => {
  try {
    const storedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    if (!storedRoute) return null;

    const routeState: RouteState = JSON.parse(storedRoute);
    
    // Check if route is too old
    if (Date.now() - routeState.timestamp > MAX_ROUTE_AGE_MS) {
      localStorage.removeItem(ROUTE_STORAGE_KEY);
      return null;
    }

    return routeState.path;
  } catch (error) {
    console.warn('Failed to get last route:', error);
    return null;
  }
};

/**
 * Get the intended route (where user wanted to go before login redirect)
 */
export const getIntendedRoute = (): string | null => {
  try {
    const storedRoute = localStorage.getItem(INTENDED_ROUTE_KEY);
    if (!storedRoute) return null;

    const routeState: RouteState = JSON.parse(storedRoute);
    
    // Check if route is too old (shorter expiry for intended routes)
    if (Date.now() - routeState.timestamp > 30 * 60 * 1000) { // 30 minutes
      localStorage.removeItem(INTENDED_ROUTE_KEY);
      return null;
    }

    return routeState.path;
  } catch (error) {
    console.warn('Failed to get intended route:', error);
    return null;
  }
};

/**
 * Clear the intended route after successful navigation
 */
export const clearIntendedRoute = (): void => {
  try {
    localStorage.removeItem(INTENDED_ROUTE_KEY);
  } catch (error) {
    console.warn('Failed to clear intended route:', error);
  }
};

/**
 * Clear all route persistence data
 */
export const clearRoutePersistence = (): void => {
  try {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
    localStorage.removeItem(INTENDED_ROUTE_KEY);
    localStorage.removeItem(ROUTE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear route persistence:', error);
  }
};

/**
 * Get the appropriate redirect route after login
 * Priority: intended route > last route > default dashboard
 */
export const getPostLoginRoute = (): string => {
  // First check for intended route (where user tried to go before login)
  const intendedRoute = getIntendedRoute();
  if (intendedRoute) {
    clearIntendedRoute(); // Clear it after use
    return intendedRoute;
  }

  // Then check for last visited route
  const lastRoute = getLastRoute();
  if (lastRoute) {
    return lastRoute;
  }

  // Default to dashboard
  return '/dashboard';
};

/**
 * Check if a route requires authentication
 */
export const isProtectedRoute = (path: string): boolean => {
  const protectedPaths = [
    '/dashboard',
    '/practice',
    '/roleplay',
    '/progress',
    '/tips',
    '/call-recordings',
    '/recordings',
    '/team',
    '/security',
    '/subscription',
    '/subscription-management',
    '/success',
    '/cancel',
    '/account-delete'
  ];

  return protectedPaths.some(protected => path.startsWith(protected));
};