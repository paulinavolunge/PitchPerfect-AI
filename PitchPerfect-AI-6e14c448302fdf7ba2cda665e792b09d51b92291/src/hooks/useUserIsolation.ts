import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { validateSessionIsolation } from '@/utils/sessionCleanup';

/**
 * Hook to ensure proper user data isolation in components
 * This hook validates that no stale user data exists and clears any that's found
 */
export const useUserIsolation = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Validate session isolation when user changes
      const isIsolated = validateSessionIsolation(user.id);
      
      if (!isIsolated && process.env.NODE_ENV === 'development') {
        console.warn('🚨 User data isolation issue detected in component');
      }
    }
  }, [user?.id]);

  const validateUserAccess = () => {
    return user?.id ? validateSessionIsolation(user.id) : false;
  };

  const getUserSpecificKey = (key: string) => {
    return user?.id ? `user_${user.id}_${key}` : null;
  };

  const clearUserData = () => {
    if (!user?.id) return false;
    
    try {
      const userPrefix = `user_${user.id}_`;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(userPrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear user data:', error);
      return false;
    }
  };

  return {
    userId: user?.id || null,
    isIsolated: user?.id ? validateSessionIsolation(user.id) : true,
    validateUserAccess,
    getUserSpecificKey,
    clearUserData
  };
};

/**
 * Hook for user-specific localStorage operations
 * This ensures all localStorage operations are properly namespaced by user ID
 */
export const useUserStorage = () => {
  const { user } = useAuth();

  const setUserItem = (key: string, value: string) => {
    if (!user?.id) {
      console.warn('Cannot set user-specific storage without authenticated user');
      return false;
    }
    
    try {
      const userKey = `user_${user.id}_${key}`;
      localStorage.setItem(userKey, value);
      return true;
    } catch (error) {
      console.error('Failed to set user storage:', error);
      return false;
    }
  };

  const getUserItem = (key: string): string | null => {
    if (!user?.id) {
      return null;
    }
    
    try {
      const userKey = `user_${user.id}_${key}`;
      return localStorage.getItem(userKey);
    } catch (error) {
      console.error('Failed to get user storage:', error);
      return null;
    }
  };

  const removeUserItem = (key: string): boolean => {
    if (!user?.id) {
      return false;
    }
    
    try {
      const userKey = `user_${user.id}_${key}`;
      localStorage.removeItem(userKey);
      return true;
    } catch (error) {
      console.error('Failed to remove user storage:', error);
      return false;
    }
  };

  const clearUserStorage = (): boolean => {
    if (!user?.id) {
      return false;
    }
    
    try {
      const userPrefix = `user_${user.id}_`;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(userPrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear user storage:', error);
      return false;
    }
  };

  return {
    setUserItem,
    getUserItem,
    removeUserItem,
    clearUserStorage,
    userId: user?.id || null
  };
};