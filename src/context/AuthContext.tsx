
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
  startFreeTrial: () => Promise<boolean>;
  deductUserCredits: (featureType: string, credits: number) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [trialUsed, setTrialUsed] = useState(false);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Auth initialization error:', error);
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Load user profile data if user exists
          if (initialSession?.user?.id) {
            await loadUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          await loadUserProfile(session.user.id);
        } else {
          // Reset user data when signed out
          setCreditsRemaining(0);
          setTrialUsed(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
      } else if (profile) {
        setCreditsRemaining(profile.credits_remaining || 0);
        setTrialUsed(profile.trial_used || false);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
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
        return false;
      }

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
      // Use the secure function for credit deduction - match current function signature
      const { data, error } = await supabase.rpc('secure_deduct_credits_and_log_usage', {
        p_user_id: user.id,
        p_feature_used: featureType
      });

      if (error) {
        console.error('Error deducting credits:', error);
        return false;
      }

      // Handle the response properly based on the function's return type
      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        
        if (result.success === true) {
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
      console.log('Signing out user...');
      
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

      console.log('User signed out successfully');
      
      // Redirect to home page using the appropriate domain
      const targetUrl = window.location.hostname.includes('lovable.app') 
        ? '/' 
        : 'https://pitchperfectai.ai/';
      
      window.location.href = targetUrl;
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, redirect to home
      const targetUrl = window.location.hostname.includes('lovable.app') 
        ? '/' 
        : 'https://pitchperfectai.ai/';
      
      window.location.href = targetUrl;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isPremium,
    creditsRemaining,
    trialUsed,
    startFreeTrial,
    deductUserCredits,
    refreshSubscription,
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
