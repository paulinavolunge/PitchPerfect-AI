// Optimized AuthContext with performance improvements
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAllSessionData, clearUserSpecificData, initializeCleanSession, validateSessionIsolation } from '@/utils/sessionCleanup';
import { SafeRPCService } from '@/services/SafeRPCService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isPremium: boolean;
  creditsRemaining: number;
  trialUsed: boolean;
  isNewUser: boolean;
  startFreeTrial: () => Promise<boolean>;
  deductUserCredits: (featureType: string, credits: number) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  markOnboardingComplete: () => void;
  initError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for user profile data
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [trialUsed, setTrialUsed] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Memoized load user profile function
  const loadUserProfile = useCallback(async (userId: string) => {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCreditsRemaining(cached.data.creditsRemaining || 0);
      setTrialUsed(cached.data.trialUsed || false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits_remaining, trial_used')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setCreditsRemaining(data.credits_remaining || 0);
        setTrialUsed(data.trial_used || false);
        
        // Update cache
        profileCache.set(userId, {
          data: { creditsRemaining: data.credits_remaining, trialUsed: data.trial_used },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, []);

  // Optimized sign out function
  const signOut = useCallback(async () => {
    try {
      clearUserSpecificData();
      await supabase.auth.signOut();
      clearAllSessionData();
      
      // Clear profile cache
      profileCache.clear();
      
      // Reset state
      setUser(null);
      setSession(null);
      setCreditsRemaining(0);
      setTrialUsed(false);
      setIsNewUser(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    signOut,
    isPremium,
    creditsRemaining,
    trialUsed,
    isNewUser,
    startFreeTrial: async () => false, // Implement as needed
    deductUserCredits: async () => false, // Implement as needed
    refreshSubscription: async () => {}, // Implement as needed
    markOnboardingComplete: () => setIsNewUser(false),
    initError
  }), [user, session, loading, signOut, isPremium, creditsRemaining, trialUsed, isNewUser, initError]);

  // Initialize auth state with timeout handling
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          setInitError(`Auth initialization failed: ${error.message}`);
          SafeRPCService.logSecurityEvent('auth_initialization_failed', { 
            error: error.message 
          });
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user?.id) {
            await loadUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        if (!mounted) return;
        setInitError(`Failed to initialize auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set timeout for auth initialization
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        setInitError('Authentication initialization timed out. Please refresh the page.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    initializeAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user?.id) {
        await loadUserProfile(newSession.user.id);
      } else {
        setCreditsRemaining(0);
        setTrialUsed(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
