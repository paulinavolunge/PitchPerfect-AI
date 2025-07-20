
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAllSessionData, clearUserSpecificData, initializeCleanSession, validateSessionIsolation } from '@/utils/sessionCleanup';

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
          // Log security event for failed auth initialization
          await supabase.rpc('log_security_event', {
            p_event_type: 'auth_initialization_failed',
            p_event_details: { error: error.message }
          });
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
        // Log security event for auth system errors
        await supabase.rpc('log_security_event', {
          p_event_type: 'auth_system_error',
          p_event_details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, !!session);
        
        // Handle different auth events with proper data isolation
        if (event === 'SIGNED_OUT' || (!session && user)) {
          console.log('🧹 User signed out, clearing all session data...');
          
          // Clear all user-specific data (preserve consent)
          clearAllSessionData(true);
          
          // Reset component state
          setUser(null);
          setSession(null);
          setCreditsRemaining(0);
          setTrialUsed(false);
          setIsNewUser(false);
          
          console.log('✅ Session data cleared for logout');
        } else if (event === 'SIGNED_IN' && session?.user?.id) {
          console.log('🚀 User signed in, initializing clean session...');
          
          // Check if this is a different user than before
          const previousUser = user;
          if (previousUser && previousUser.id !== session.user.id) {
            console.log('👤 Different user detected, clearing previous user data...');
            clearUserSpecificData(previousUser.id);
          }
          
          // Initialize clean session for new user
          initializeCleanSession(session.user.id);
          
          // Update state
          setSession(session);
          setUser(session.user);
          
          // Load fresh user profile data
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
          
          // Check if this is a new user (after cleanup)
          const hasCompletedOnboarding = localStorage.getItem('onboardingComplete');
          if (!hasCompletedOnboarding) {
            setIsNewUser(true);
          }
          
          // Validate session isolation in development
          if (process.env.NODE_ENV === 'development') {
            setTimeout(() => validateSessionIsolation(session.user.id), 100);
          }
          
          console.log('✅ Clean session initialized for user:', session.user.id);
        } else if (event === 'TOKEN_REFRESHED' && session?.user?.id) {
          // Token refresh - maintain current state but verify data integrity
          setSession(session);
          setUser(session.user);
          
          // Validate no data leakage occurred
          if (process.env.NODE_ENV === 'development') {
            validateSessionIsolation(session.user.id);
          }
        } else {
          // Handle other events (PASSWORD_RECOVERY, etc.)
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        // Log security events for auth state changes
        if (session?.user?.id) {
          setTimeout(() => {
            supabase.rpc('log_security_event', {
              p_event_type: `auth_${event}`,
              p_event_details: { 
                user_id: session.user.id,
                session_isolated: true
              },
              p_user_id: session.user.id
            });
          }, 0);
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
      console.log('🔍 Loading user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('credits_remaining, trial_used')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile error code:', error.code, 'message:', error.message);
        
        // Handle case where profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('⚠️ User profile not found, creating new profile...');
          
          // Try to create the profile (should be automatic via trigger, but fallback)
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({ 
              id: userId, 
              credits_remaining: 1, // Free credit on signup
              trial_used: false 
            })
            .select('credits_remaining, trial_used')
            .single();
            
          if (insertError) {
            console.warn('Could not create user profile:', insertError);
            // Use defaults if creation fails
            setCreditsRemaining(1);
            setTrialUsed(false);
          } else {
            console.log('✅ Created new user profile:', newProfile);
            setCreditsRemaining(newProfile.credits_remaining || 1);
            setTrialUsed(newProfile.trial_used || false);
          }
        } else {
          console.error('Error loading user profile:', error);
          // Log security event for profile access issues
          await supabase.rpc('log_security_event', {
            p_event_type: 'profile_access_failed',
            p_event_details: { error: error.message },
            p_user_id: userId
          });
          
          // Use safe defaults
          setCreditsRemaining(0);
          setTrialUsed(false);
        }
      } else if (profile) {
        console.log('✅ Loaded user profile:', profile);
        setCreditsRemaining(profile.credits_remaining || 0);
        setTrialUsed(profile.trial_used || false);
      } else {
        console.warn('No profile data returned');
        setCreditsRemaining(0);
        setTrialUsed(false);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      
      // Log security event for profile loading errors
      await supabase.rpc('log_security_event', {
        p_event_type: 'profile_loading_error',
        p_event_details: { error: error instanceof Error ? error.message : 'Unknown error' },
        p_user_id: userId
      });
      
      // Use safe defaults on any error
      setCreditsRemaining(0);
      setTrialUsed(false);
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
        // Log security event for trial activation failure
        await supabase.rpc('log_security_event', {
          p_event_type: 'trial_activation_failed',
          p_event_details: { error: error.message },
          p_user_id: user.id
        });
        return false;
      }

      // Log successful trial activation
      await supabase.rpc('log_security_event', {
        p_event_type: 'trial_activated',
        p_event_details: { credits_added: 10 },
        p_user_id: user.id
      });

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
      // Use the secure function for credit deduction
      const { data, error } = await supabase.rpc('secure_deduct_credits_and_log_usage', {
        p_user_id: user.id,
        p_feature_used: featureType
      });

      if (error) {
        console.error('Error deducting credits:', error);
        // Log security event for credit deduction failure
        await supabase.rpc('log_security_event', {
          p_event_type: 'credit_deduction_failed',
          p_event_details: { 
            feature: featureType,
            error: error.message 
          },
          p_user_id: user.id
        });
        return false;
      }

      // Handle the response properly based on the function's return type
      if (typeof data === 'object' && data !== null) {
        const result = data as any;
        
        if (result.success === true) {
          setCreditsRemaining(result.remaining_credits || 0);
          return true;
        } else {
          console.error('Credit deduction failed:', result.error);
          return false;
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
      
      const currentUserId = user?.id;
      
      // Log security event for sign out
      if (currentUserId) {
        await supabase.rpc('log_security_event', {
          p_event_type: 'user_signout_initiated',
          p_event_details: { clean_logout: true },
          p_user_id: currentUserId
        });
      }
      
      // Clear ALL session data including localStorage (preserve consent)
      console.log('🧹 Clearing all session data on logout...');
      clearAllSessionData(true);
      
      // Clear local state
      setUser(null);
      setSession(null);
      setCreditsRemaining(0);
      setTrialUsed(false);
      setIsNewUser(false);
      
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
      
      // Even if there's an error, clear local data and redirect
      clearAllSessionData(true);
      setUser(null);
      setSession(null);
      setCreditsRemaining(0);
      setTrialUsed(false);
      setIsNewUser(false);
      
      const targetUrl = window.location.hostname.includes('lovable.app') 
        ? 'https://pitchperfectai.lovable.app/' 
        : 'https://pitchperfectai.ai/';
      
      window.location.href = targetUrl;
    }
  };

  const markOnboardingComplete = () => {
    if (!user?.id) return;
    
    setIsNewUser(false);
    // Use user-specific keys for onboarding completion
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
    localStorage.setItem(`user_${user.id}_onboarding_complete`, 'true');
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
