
import React, { createContext, useContext, useEffect, useState } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [trialUsed, setTrialUsed] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth initialization error:', error);
          setInitError(`Auth initialization failed: ${error.message}`);
          // Log security event for failed auth initialization
          SafeRPCService.logSecurityEvent('auth_initialization_failed', { 
            error: error.message 
          });
        } else {
          console.log('AuthContext: Initial session loaded', !!initialSession);
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Load user profile data if user exists
          if (initialSession?.user?.id) {
            console.log('AuthContext: Loading user profile for:', initialSession.user.id);
            await loadUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setInitError(`Failed to initialize auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  // Log security event for auth system errors
          SafeRPCService.logSecurityEvent('auth_system_error', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
      } finally {
        console.log('AuthContext: Setting loading to false');
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Auth initialization timeout - attempting recovery');
        // Instead of just setting error, try to check session one more time
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('Session found in timeout recovery');
            setSession(session);
            setUser(session.user);
            setLoading(false);
            setInitError(null);
            // Load profile in background
            if (session.user?.id) {
              loadUserProfile(session.user.id);
            }
          } else {
            console.error('No session found in timeout recovery');
            setInitError('Authentication initialization timed out. Please refresh the page.');
            setLoading(false);
          }
        }).catch(err => {
          console.error('Failed to recover from timeout:', err);
          setInitError('Authentication initialization timed out. Please refresh the page.');
          setLoading(false);
        });
      }
    }, 30000); // Increased to 30 seconds

    initializeAuth();

    return () => clearTimeout(timeoutId);
  }, []);

  // Listen for auth changes in a separate effect
  useEffect(() => {
    let mounted = true;
    let lastEventLogged: string | null = null;
    
    const subscription = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Prevent duplicate event logging
        const eventKey = `${event}_${session?.user?.id || 'anonymous'}`;
        if (lastEventLogged === eventKey) {
          return;
        }
        lastEventLogged = eventKey;
        
        if (event === 'INITIAL_SESSION') {
          // Initial load - set session and user
          setSession(session);
          setUser(session?.user ?? null);
          
          // Clean any stale data first
          if (!session?.user) {
            clearUserSpecificData();
          }
        } else if (event === 'SIGNED_IN') {
          // User signed in - clean old data and set new session
          if (session?.user?.id) {
            await initializeCleanSession(session.user.id);
          }
          setSession(session);
          setUser(session.user);
          
          // Validate no data leakage occurred
          if (process.env.NODE_ENV === 'development') {
            validateSessionIsolation(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out - clear everything
          clearAllSessionData();
          setSession(null);
          setUser(null);
          setIsPremium(false);
          setCreditsRemaining(0);
          setTrialUsed(false);
          setIsNewUser(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed - update session
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
        
        // Log security events for auth state changes (throttled by SafeRPCService)
        if (session?.user?.id && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
          SafeRPCService.logSecurityEvent(`auth_${event}`, { 
            user_id: session.user.id,
            session_isolated: true
          }, session.user.id);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, retryCount: number = 0): Promise<void> => {
    if (!userId) return;
    
    try {
      // Use SafeRPCService for better error handling
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('credits_remaining, trial_used')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // Don't retry on certain errors
        if (error.code === 'PGRST116' || error.message?.includes('multiple')) {
          // No profile exists yet, create one
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({ 
              id: userId, 
              credits_remaining: 1,
              trial_used: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('credits_remaining, trial_used')
            .single();
            
          if (createError) {
            // Try upsert as fallback
            const { data: upsertProfile, error: upsertError } = await supabase
              .from('user_profiles')
              .upsert({ 
                id: userId, 
                credits_remaining: 1,
                trial_used: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              })
              .select('credits_remaining, trial_used')
              .single();
              
            if (upsertError) {
              console.error('Profile creation failed:', upsertError);
              // Use defaults
              setCreditsRemaining(1);
              setTrialUsed(false);
            } else if (upsertProfile) {
              setCreditsRemaining(upsertProfile.credits_remaining || 1);
              setTrialUsed(upsertProfile.trial_used || false);
            }
          } else if (newProfile) {
            setCreditsRemaining(newProfile.credits_remaining || 1);
            setTrialUsed(newProfile.trial_used || false);
          }
        } else if (error.code === '429' || error.message?.includes('rate limit')) {
          // Rate limited - use cached values or defaults
          console.warn('Rate limited when fetching profile');
          setCreditsRemaining(prev => prev || 1);
          setTrialUsed(prev => prev || false);
          return;
        } else {
          console.error('Error loading user profile:', error);
          
          // Only retry on temporary errors, not on rate limits
          if (retryCount < 2 && error.code === 'PGRST301') {
            await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
            return loadUserProfile(userId, retryCount + 1);
          }
          
          // Use safe defaults
          setCreditsRemaining(1);
          setTrialUsed(false);
        }
      } else if (profile) {
        setCreditsRemaining(profile.credits_remaining || 0);
        setTrialUsed(profile.trial_used || false);
      } else {
        // No profile exists, create one
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({ 
            id: userId, 
            credits_remaining: 1,
            trial_used: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('credits_remaining, trial_used')
          .single();
          
        if (newProfile) {
          setCreditsRemaining(newProfile.credits_remaining || 1);
          setTrialUsed(newProfile.trial_used || false);
        } else {
          setCreditsRemaining(1);
          setTrialUsed(false);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      
      // Don't retry on network errors to prevent spam
      setCreditsRemaining(1);
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
        await SafeRPCService.logSecurityEvent(
          'trial_activation_failed',
          { error: error.message },
          user.id
        );
        return false;
      }

      // Log successful trial activation
      await SafeRPCService.logSecurityEvent(
        'trial_activated',
        { credits_added: 10 },
        user.id
      );

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
      const result = await SafeRPCService.deductCredits(user.id, featureType);
      
      if (result.success) {
        setCreditsRemaining(result.remainingCredits);
        return true;
      } else {
        console.error('Credit deduction failed');
        // Log security event for credit deduction failure
        SafeRPCService.logSecurityEvent('credit_deduction_failed', { 
          feature: featureType
        }, user.id);
        return false;
      }
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
        SafeRPCService.logSecurityEvent('user_signout_initiated', { 
          clean_logout: true 
        }, currentUserId);
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

  const markOnboardingComplete = async () => {
    setIsNewUser(false);
    
    // Save to localStorage
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
    
    // Save to user profile if user exists
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Failed to update onboarding status:', error);
        }
      } catch (err) {
        console.error('Error saving onboarding status:', err);
      }
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
    isNewUser,
    startFreeTrial,
    deductUserCredits,
    refreshSubscription,
    markOnboardingComplete,
    initError,
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
