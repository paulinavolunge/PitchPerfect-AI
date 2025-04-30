
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
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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
  const { toast } = useToast();

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
              variant: "default", // Changed from "success" to "default"
            });
          }
          
          refreshSubscription();
        } else {
          setEmailVerified(false);
          setIsPremium(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
      signOut,
      refreshSubscription,
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
