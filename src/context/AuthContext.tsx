import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types'; // Import your new database types

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isPremium: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  emailVerified: boolean;

  // New credit system states
  creditsRemaining: number;
  trialUsed: boolean;

  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  startFreeTrial: () => Promise<void>;

  // New function to deduct credits from the frontend
  deductUserCredits: (feature: string, credits: number) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  // New states for credit system
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [trialUsed, setTrialUsed] = useState(false);
  const { toast } = useToast();

  // Function to fully clear all auth state
  const clearAuthState = useCallback(() => {
    console.log('Clearing all auth state');
    setUser(null);
    setSession(null);
    setIsPremium(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
    setEmailVerified(false);
    setError(null);

    // Clear new credit states
    setCreditsRemaining(0);
    setTrialUsed(false);
  }, []);

  // Refresh subscription data and user profile data
  const refreshSubscription = useCallback(async () => {
    if (!user) {
      console.log('No user to refresh subscription for.');
      return;
    }

    console.log('Refreshing subscription and user profile data...');

    try {
      // Fetch subscription data
      const { data: subscriptionData, error: subError } = await supabase.functions.invoke('check-subscription');

      if (subError) {
        console.error('Error checking subscription:', subError);
        // Don't throw, just log and set defaults
        setIsPremium(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
      } else {
        setIsPremium(subscriptionData?.subscribed || false);
        setSubscriptionTier(subscriptionData?.subscription_tier || null);
        setSubscriptionEnd(subscriptionData?.subscription_end || null);
      }

      // Fetch user_profiles data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('credits_remaining, trial_used')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching user profile:', profileError);
        // Set defaults if profile not found or error
        setCreditsRemaining(0);
        setTrialUsed(true); // Assume trial used if profile not found/error
      } else if (profileData) {
        setCreditsRemaining(profileData.credits_remaining);
        setTrialUsed(profileData.trial_used);
      } else {
        // This case should ideally not happen if handle_new_user trigger works
        console.warn('User profile not found after authentication.');
        setCreditsRemaining(0);
        setTrialUsed(true); // Assume trial used if profile doesn't exist
      }

    } catch (err) {
      console.error('Error refreshing subscription or profile:', err);
    }
  }, [user]);

  // Start a free pitch analysis (repurposed from time-based trial)
  const startFreeTrial = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to get a free pitch analysis.",
        variant: "destructive",
      });
      return Promise.reject("Authentication required");
    }

    if (trialUsed) {
      toast({
        title: "Free analysis already used",
        description: "You have already used your free pitch analysis.",
      });
      return Promise.resolve();
    }

    if (creditsRemaining > 0) {
        toast({
          title: "You have credits!",
          description: "You already have credits available. No need for a free analysis.",
        });
        return Promise.resolve();
    }

    try {
        // Update trial_used to true and add 1 credit
        const { data, error } = await supabase
            .from('user_profiles')
            .update({ trial_used: true, credits_remaining: 1 })
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            setTrialUsed(data.trial_used);
            setCreditsRemaining(data.credits_remaining);
            toast({
                title: "1 Free Pitch Analysis Granted!",
                description: "You now have 1 credit for a pitch analysis. Welcome!",
            });
            return Promise.resolve();
        }
    } catch (error: any) {
        console.error('Error granting free pitch analysis:', error);
        toast({
            title: "Error",
            description: error.message || "There was a problem granting your free analysis. Please try again.",
            variant: "destructive",
        });
        return Promise.reject(error);
    }
  }, [user, trialUsed, creditsRemaining, toast]);

  // Function to deduct credits via Supabase RPC
  const deductUserCredits = useCallback(async (feature: string, credits: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use this feature.",
        variant: "destructive",
      });
      return false;
    }

    if (creditsRemaining < credits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${credits} credits for this feature, but you only have ${creditsRemaining}. Please upgrade your plan.`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('deduct_credits_and_log_usage', {
        p_user_id: user.id,
        p_feature_used: feature,
        p_credits_to_deduct: credits,
      });

      if (error) {
        console.error('Error deducting credits:', error);
        toast({
          title: "Error Deducting Credits",
          description: error.message || "Failed to deduct credits. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (data === true) {
        // Update local state after successful deduction
        setCreditsRemaining(prev => prev - credits);
        return true;
      } else {
        toast({
          title: "Credit Deduction Failed",
          description: "An unexpected error occurred during credit deduction.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Exception during credit deduction:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, creditsRemaining, toast]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      console.log('Sign out initiated');

      // First clear all user state completely before calling signOut
      clearAuthState();

      // Then call Supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error in supabase.auth.signOut():', error);
        throw error;
      }

      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });

      console.log("User signed out and state cleared");
    } catch (err) {
      console.error('Error signing out:', err);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  }, [clearAuthState, toast]);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          clearAuthState();
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);

          if (data.session?.user) {
            setEmailVerified(data.session.user.email_confirmed_at !== null);
          }
        }
      } catch (err) {
        console.error('Error getting session:', err);
        if (mounted) {
          setError('Failed to get session');
          clearAuthState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Set up the auth listener
    console.log('Setting up auth listener');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => { // Mark as async to await refreshSubscription
        if (!mounted) return;

        console.log('Auth state changed:', event, 'Session exists:', Boolean(session));

        if (event === 'SIGNED_OUT') {
          clearAuthState();
          console.log('User signed out, cleared auth state');
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            setEmailVerified(session.user.email_confirmed_at !== null);

            // Show success toast when email is confirmed
            if (event === 'SIGNED_IN' && session.user.email_confirmed_at) {
              toast({
                title: "Email verified",
                description: "Your email has been successfully verified.",
                variant: "default",
              });
            }
          }
        }

        setLoading(false);
        // Refresh user profile and subscription details on sign-in or session refresh
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          await refreshSubscription(); // Ensure this is awaited
        }
      }
    );

    return () => {
      mounted = false;
      console.log('Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, [clearAuthState, toast, refreshSubscription]); // Add refreshSubscription to dependencies

  // Effect to handle subscription and trial checks when user changes
  useEffect(() => {
    if (user) {
      // Use setTimeout to avoid blocking the auth state change
      // Call refreshSubscription here as well to ensure data is fresh on user state change
      setTimeout(() => {
        refreshSubscription();
      }, 0);
    }
  }, [user, refreshSubscription]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      isPremium,
      subscriptionTier,
      subscriptionEnd,
      emailVerified,

      creditsRemaining,
      trialUsed,

      signOut,
      refreshSubscription,
      startFreeTrial,
      deductUserCredits,
    }}>
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
