/**
 * Enhanced session security utilities
 */

interface SessionValidationResult {
  isValid: boolean;
  shouldRefresh: boolean;
  reason?: string;
}

/**
 * Validate session integrity and detect tampering
 */
export const validateSessionIntegrity = (session: any): SessionValidationResult => {
  if (!session) {
    return { isValid: false, shouldRefresh: false, reason: 'No session' };
  }

  // Check for required session properties
  if (!session.access_token || !session.user?.id) {
    return { isValid: false, shouldRefresh: true, reason: 'Invalid session structure' };
  }

  // Check if token is expired
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
  const now = new Date();
  
  if (expiresAt && now > expiresAt) {
    return { isValid: false, shouldRefresh: true, reason: 'Session expired' };
  }

  // Check if session is close to expiring (refresh if < 5 minutes left)
  if (expiresAt && (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
    return { isValid: true, shouldRefresh: true, reason: 'Session expiring soon' };
  }

  return { isValid: true, shouldRefresh: false };
};

/**
 * Auto-logout after period of inactivity
 */
export class SessionTimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly timeoutDuration: number;
  private readonly onTimeout: () => void;

  constructor(timeoutMinutes: number = 120, onTimeout: () => void) {
    this.timeoutDuration = timeoutMinutes * 60 * 1000;
    this.onTimeout = onTimeout;
  }

  resetTimeout() {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.onTimeout();
    }, this.timeoutDuration);
  }

  clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  destroy() {
    this.clearTimeout();
  }
}

/**
 * Enhanced session cleanup that validates in production
 */
export const performSecureSessionCleanup = (userId?: string): void => {
  // Always validate session isolation in production
  const isProduction = import.meta.env.PROD;
  
  if (isProduction || import.meta.env.DEV) {
    // Check for potential data leaks
    const allKeys = Object.keys(localStorage);
    const userSpecificKeys = allKeys.filter(key => 
      key.includes('user_') || 
      key.includes('profile_') ||
      key.includes('session_')
    );

    userSpecificKeys.forEach(key => {
      if (userId) {
        // If we have a user ID, only keep keys that belong to this user
        if (!key.includes(userId)) {
          localStorage.removeItem(key);
        }
      } else {
        // If no user ID, remove all user-specific keys
        localStorage.removeItem(key);
      }
    });
  }

  // Clear potentially sensitive data
  const sensitiveKeys = [
    'temp_recording',
    'cache_voice_analysis',
    'demo_data',
    'practice_session_temp'
  ];

  sensitiveKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};
