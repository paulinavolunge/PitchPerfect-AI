
const SESSION_CACHE_KEY = 'pitchperfect_session_history';

export interface SessionHistoryItem {
  id: string;
  date: string;
  scenario: {
    difficulty: string;
    industry: string;
    objection: string;
    custom?: string;
  };
  duration: number;
  score?: number;
  transcriptLength?: number;
}

/**
 * Cache session history in localStorage for faster revisits
 */
export const SessionCache = {
  /**
   * Save session history to cache
   */
  saveSessionHistory: (sessions: SessionHistoryItem[]): void => {
    try {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error caching session history:', error);
    }
  },

  /**
   * Get session history from cache
   */
  getSessionHistory: (): SessionHistoryItem[] => {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error retrieving cached session history:', error);
      return [];
    }
  },

  /**
   * Add a new session to history cache
   */
  addSession: (session: SessionHistoryItem): void => {
    try {
      const existingSessions = SessionCache.getSessionHistory();
      existingSessions.unshift(session); // Add to beginning of array
      
      // Limit cache to 50 sessions to prevent localStorage overflow
      const limitedSessions = existingSessions.slice(0, 50);
      
      SessionCache.saveSessionHistory(limitedSessions);
    } catch (error) {
      console.error('Error adding session to cache:', error);
    }
  },

  /**
   * Clear session history cache
   */
  clearSessionHistory: (): void => {
    try {
      localStorage.removeItem(SESSION_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing session history cache:', error);
    }
  }
};

export default SessionCache;
