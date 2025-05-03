
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isPremium: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  emailVerified: boolean;
  trialActive: boolean;
  trialEndsAt: Date | null;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  startFreeTrial: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TRIAL_DURATION_DAYS = 7;
const TRIAL_KEY = 'trial_start_date';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [trialActive, setTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const { toast } = useToast();

  // Check if the user has an active trial
  const checkTrialStatus = () => {
    if (!user) {
      setTrialActive(false);
      setTrialEndsAt(null);
      return;
    }

    // Get the trial start date from localStorage
    const trialStartDateStr = localStorage.getItem(`${TRIAL_KEY}_${user.id}`);
    
    if (!trialStartDateStr) {
      setTrialActive(false);
      setTrialEndsAt(null);
      return;
    }

    const trialStartDate = new Date(trialStartDateStr);
    const now = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);
    
    // Check if the trial is still active
    const isActive = now < trialEndDate;
    setTrialActive(isActive);
    setTrialEndsAt(isActive ? trialEndDate : null);
    
    // If trial just ended, show a notification
    if (!isActive && localStorage.getItem(`${TRIAL_KEY}_notification_${user.id}`) !== 'shown') {
      toast({
        title: "Free trial ended",
        description: "Your 7-day free trial has ended. Upgrade to Premium to continue accessing premium features.",
      });
      localStorage.setItem(`${TRIAL_KEY}_notification_${user.id}`, 'shown');
    }
  };

  // Start a free trial for the user
  const startFreeTrial = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to start a free trial.",
        variant: "destructive",
      });
      return Promise.reject("Authentication required");
    }

    // Check if user already has a trial
    const existingTrialDate = localStorage.getItem(`${TRIAL_KEY}_${user.id}`);
    if (existingTrialDate) {
      const trialStartDate = new Date(existingTrialDate);
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);
      
      // If trial is still active, just notify the user
      if (new Date() < trialEndDate) {
        setTrialActive(true);
        setTrialEndsAt(trialEndDate);
        toast({
          title: "Trial already active",
          description: `Your trial is already active and will end on ${trialEndDate.toLocaleDateString()}.`,
        });
        return Promise.resolve();
      }
    }

    // Set the trial start date
    const now = new Date();
    localStorage.setItem(`${TRIAL_KEY}_${user.id}`, now.toISOString());
    
    // Calculate end date
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);
    
    setTrialActive(true);
    setTrialEndsAt(trialEndDate);
    
    // Remove any previous notification shown flag
    localStorage.removeItem(`${TRIAL_KEY}_notification_${user.id}`);
    
    toast({
      title: "Free trial started!",
      description: `You now have ${TRIAL_DURATION_DAYS} days of access to premium features.`,
    });
    
    return Promise.resolve();
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          
          // Check if email is verified
          if (data.session?.user) {
            setEmailVerified(data.session.user.email_confirmed_at !== null);
            refreshSubscription();
            checkTrialStatus();
          }
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setError('Failed to get session');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if email is verified
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
          
          refreshSubscription();
          checkTrialStatus();
        } else {
          setEmailVerified(false);
          setIsPremium(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setTrialActive(false);
          setTrialEndsAt(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check trial status periodically (every 10 minutes)
  useEffect(() => {
    if (!user) return;
    
    const checkInterval = setInterval(checkTrialStatus, 10 * 60 * 1000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [user]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (err) {
      console.error('Error signing out:', err);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshSubscription = async () => {
    if (!user) return;
    
    try {
      const { data: subscriptionData, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      setIsPremium(subscriptionData.subscribed || false);
      setSubscriptionTier(subscriptionData.subscription_tier || null);
      setSubscriptionEnd(subscriptionData.subscription_end || null);
    } catch (err) {
      console.error('Error refreshing subscription:', err);
    }
  };

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
      trialActive,
      trialEndsAt,
      signOut,
      refreshSubscription,
      startFreeTrial,
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
