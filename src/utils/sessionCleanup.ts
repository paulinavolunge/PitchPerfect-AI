/**
 * Session and localStorage cleanup utilities to prevent data leaks between users
 */

export interface UserDataKeys {
  readonly general: readonly string[];
  readonly userSpecific: readonly string[];
  readonly analytics: readonly string[];
  readonly onboarding: readonly string[];
  readonly crm: readonly string[];
  readonly routing: readonly string[];
}

// Define all localStorage keys used in the application
export const USER_DATA_KEYS: UserDataKeys = {
  general: [
    'guestMode',
    'guestSessionId',
    'demoRequests',
    'user_feedback',
    'crm_connections'
  ] as const,
  userSpecific: [
    'selectedIndustry',
    'topChallenge',
    'userIndustry', 
    'userChallenge',
    'trialStarted',
    'user_progress'
  ] as const,
  analytics: [
    'privacy-consent',
    'marketing-consent',
    'analytics-consent',
    'consent-preferences',
    'aiSettings'
  ] as const,
  onboarding: [
    'onboardingComplete',
    'onboardingCompletedAt',
    'onboarding_completed',
    'user_visited_before',
    'hasCompletedOnboarding',
    'pitchperfect_tour_completed'
  ] as const,
  crm: [
    'crm_connections'
  ] as const,
  routing: [
    'lastVisitedRoute',
    'intendedRoute',
    'routeTimestamp'
  ] as const
} as const;

/**
 * Clear all user-specific data from localStorage
 * This should be called on logout and before loading new user data
 */
export const clearUserSpecificData = (userId?: string): void => {
  console.log('🧹 Clearing user-specific data...', { userId });

  // Clear all user-specific keys
  [...USER_DATA_KEYS.userSpecific, ...USER_DATA_KEYS.onboarding].forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Cleared localStorage key: ${key}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clear localStorage key ${key}:`, error);
    }
  });

  // Clear user-specific keys with user ID prefix if provided
  if (userId) {
    const userSpecificPatterns = [
      `streak_${userId}`,
      `user_${userId}_`,
      `progress_${userId}`,
      `settings_${userId}`
    ];

    userSpecificPatterns.forEach(pattern => {
      try {
        // Check all localStorage keys for user-specific patterns
        Object.keys(localStorage).forEach(key => {
          if (key.includes(pattern)) {
            localStorage.removeItem(key);
            console.log(`✅ Cleared user-specific key: ${key}`);
          }
        });
      } catch (error) {
        console.warn(`⚠️ Failed to clear user-specific pattern ${pattern}:`, error);
      }
    });
  }
};

/**
 * Clear all session data including localStorage and sessionStorage
 * This is a comprehensive cleanup for logout
 */
export const clearAllSessionData = (preserveConsent: boolean = true, preserveRouting: boolean = false): void => {
  console.log('🧹 Clearing all session data...', { preserveConsent, preserveRouting });

  // Preserve consent data if requested
  let consentData: Record<string, string | null> = {};
  if (preserveConsent) {
    USER_DATA_KEYS.analytics.forEach(key => {
      try {
        consentData[key] = localStorage.getItem(key);
      } catch (error) {
        console.warn(`⚠️ Failed to preserve consent data for ${key}:`, error);
      }
    });
  }

  // Preserve routing data if requested
  let routingData: Record<string, string | null> = {};
  if (preserveRouting) {
    USER_DATA_KEYS.routing.forEach(key => {
      try {
        routingData[key] = localStorage.getItem(key);
      } catch (error) {
        console.warn(`⚠️ Failed to preserve routing data for ${key}:`, error);
      }
    });
  }

  // Clear all localStorage except preserved data
  try {
    const keysToRemove = preserveRouting 
      ? [...USER_DATA_KEYS.general, ...USER_DATA_KEYS.userSpecific, ...USER_DATA_KEYS.onboarding, ...USER_DATA_KEYS.crm]
      : [...USER_DATA_KEYS.general, ...USER_DATA_KEYS.userSpecific, ...USER_DATA_KEYS.onboarding, ...USER_DATA_KEYS.crm, ...USER_DATA_KEYS.routing];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear any remaining user-specific patterns
    Object.keys(localStorage).forEach(key => {
      if (key.includes('user_') || key.includes('streak_') || key.includes('progress_')) {
        localStorage.removeItem(key);
      }
    });

    console.log('✅ Cleared all localStorage data');
  } catch (error) {
    console.warn('⚠️ Failed to clear localStorage:', error);
  }

  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ Cleared all sessionStorage data');
  } catch (error) {
    console.warn('⚠️ Failed to clear sessionStorage:', error);
  }

  // Restore consent data if preserved
  if (preserveConsent) {
    Object.entries(consentData).forEach(([key, value]) => {
      if (value !== null) {
        try {
          localStorage.setItem(key, value);
          console.log(`✅ Restored consent data: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Failed to restore consent data for ${key}:`, error);
        }
      }
    });
  }

  // Restore routing data if preserved
  if (preserveRouting) {
    Object.entries(routingData).forEach(([key, value]) => {
      if (value !== null) {
        try {
          localStorage.setItem(key, value);
          console.log(`✅ Restored routing data: ${key}`);
        } catch (error) {
          console.warn(`⚠️ Failed to restore routing data for ${key}:`, error);
        }
      }
    });
  }
};

/**
 * Initialize clean session for new user login
 * This ensures no stale data affects the new user session
 */
export const initializeCleanSession = (newUserId: string): void => {
  console.log('🚀 Initializing clean session for user:', newUserId);

  // Clear any existing user-specific data
  clearUserSpecificData();

  // Verify no stale user data exists
  const staleDataKeys = Object.keys(localStorage).filter(key => 
    key.includes('user_') || 
    key.includes('streak_') || 
    key.includes('progress_') ||
    USER_DATA_KEYS.userSpecific.includes(key as any) ||
    USER_DATA_KEYS.onboarding.includes(key as any)
  );

  if (staleDataKeys.length > 0) {
    console.warn('⚠️ Found stale data keys, cleaning up:', staleDataKeys);
    staleDataKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove stale key ${key}:`, error);
      }
    });
  }

  console.log('✅ Clean session initialized for user:', newUserId);
};

/**
 * Validate that no user data is leaking between sessions
 * This can be used in development to ensure proper cleanup
 */
export const validateSessionIsolation = (currentUserId?: string): boolean => {
  const potentialLeaks: string[] = [];

  // Check for user-specific keys that don't match current user
  Object.keys(localStorage).forEach(key => {
    if (key.includes('user_') || key.includes('streak_') || key.includes('progress_')) {
      if (currentUserId && !key.includes(currentUserId)) {
        potentialLeaks.push(key);
      } else if (!currentUserId) {
        potentialLeaks.push(key);
      }
    }
  });

  // Check for general user-specific data when no user is logged in
  if (!currentUserId) {
    USER_DATA_KEYS.userSpecific.forEach(key => {
      if (localStorage.getItem(key)) {
        potentialLeaks.push(key);
      }
    });
  }

  if (potentialLeaks.length > 0) {
    console.warn('🚨 Potential data leaks detected:', potentialLeaks);
    return false;
  }

  console.log('✅ Session isolation validated');
  return true;
};