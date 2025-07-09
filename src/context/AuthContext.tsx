
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [trialUsed, setTrialUsed] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Auth initialization error:', error);
          // Skip RPC call if it causes issues - just log locally for now
        } else {
          console.log('AuthContext: Initial session', !!initialSession);
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Load user profile data if user exists
          if (initialSession?.user?.id) {
            await loadUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
        // Skip logging to avoid app crashes
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, !!session);
        
        // Track auth state changes locally
        if (session?.user?.id) {
          // Skip RPC calls to avoid app crashes

          // Check if this is a new user
          if (event === 'SIGNED_IN') {
            const hasCompletedOnboarding = localStorage.getItem('onboardingComplete');
            if (!hasCompletedOnboarding) {
              setIsNewUser(true);
            }
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          // Reset user data when signed out
          setCreditsRemaining(0);
          setTrialUsed(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('credits_remaining, trial_used')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        // Skip RPC call to avoid app crashes
      } else if (profile) {
        setCreditsRemaining(profile.credits_remaining || 0);
        setTrialUsed(profile.trial_used || false);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Skip RPC call to avoid app crashes
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      await loadUserProfile(user.id);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  const startFreeTrial = async (): Promise<boolean> => {
    if (!user?.id || trialUsed) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          trial_used: true,
          credits_remaining: creditsRemaining + 10 // Add 10 trial credits
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error starting free trial:', error);
        // Skip RPC call to avoid app crashes
        return false;
      }

      // Skip RPC call to avoid app crashes

      setTrialUsed(true);
      setCreditsRemaining(prev => prev + 10);
      return true;
    } catch (error) {
      console.error('Failed to start free trial:', error);
      return false;
    }
  };

  const deductUserCredits = async (featureType: string, credits: number): Promise<boolean> => {
    if (!user?.id || creditsRemaining < credits) {
      return false;
    }

    try {
      // Use atomic credit deduction for better security and race condition protection
      const { data, error } = await supabase.rpc('atomic_deduct_credits', {
        p_user_id: user.id,
        p_feature_used: featureType,
        p_credits_to_deduct: credits
      });

      if (error) {
        console.error('Error deducting credits:', error);
        return false;
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as any;
        if (result.success) {
          // Update local state with actual remaining credits from database
          setCreditsRemaining(result.remaining_credits || 0);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to deduct credits:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out user...');
      
      // Skip RPC call to avoid app crashes
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setCreditsRemaining(0);
      setTrialUsed(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }

      console.log('AuthContext: User signed out successfully');
      
      // Redirect to appropriate domain
      const targetUrl = window.location.hostname.includes('lovable.app') 
        ? 'https://pitchperfectai.lovable.app/' 
        : 'https://pitchperfectai.ai/';
      
      window.location.href = targetUrl;
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, redirect to home
      const targetUrl = window.location.hostname.includes('lovable.app') 
        ? 'https://pitchperfectai.lovable.app/' 
        : 'https://pitchperfectai.ai/';
      
      window.location.href = targetUrl;
    }
  };

  const markOnboardingComplete = () => {
    setIsNewUser(false);
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isPremium,
    creditsRemaining,
    trialUsed,
    isNewUser,
    startFreeTrial,
    deductUserCredits,
    refreshSubscription,
    markOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
