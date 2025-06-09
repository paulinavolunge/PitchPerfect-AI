import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { SecureDataService } from '@/services/SecureDataService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  creditsRemaining: number;
  trialUsed: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  checkCreditsAndWarn: (creditsNeeded: number, featureName: string) => boolean;
  startFreeTrial: () => Promise<boolean>;
  deductUserCredits: (featureUsed: string, creditsToDeduct: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [trialUsed, setTrialUsed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setUser(session?.user || null);
          await fetchUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsPremium(false);
          setCreditsRemaining(0);
          setTrialUsed(false);
        }
        setAuthLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits_remaining, trial_used')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setIsPremium(false); // We'll determine this from subscription data later
      setCreditsRemaining(data?.credits_remaining || 0);
      setTrialUsed(data?.trial_used || false);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshSubscription = async () => {
    await fetchUserProfile();
  };

  const deductUserCredits = async (featureUsed: string, creditsToDeduct: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this feature.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await SecureDataService.deductCreditsSecurely(featureUsed, creditsToDeduct);
      
      if (result.success) {
        // Update local state with new credit balance
        setCreditsRemaining(result.remaining_credits);
        
        // Show success toast with credit usage info
        const featureName = featureUsed.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        toast({
          title: `${creditsToDeduct} Credit${creditsToDeduct > 1 ? 's' : ''} Used`,
          description: `Credits used for ${featureName}. You have ${result.remaining_credits} credits remaining.`,
          duration: 4000,
        });
        
        return true;
      } else {
        // Handle insufficient credits or other errors
        if (result.error?.includes('Insufficient credits')) {
          toast({
            title: "Out of Credits",
            description: "You don't have enough credits to start this session. Please visit the Pricing page to top up.",
            variant: "destructive",
            duration: 8000,
            action: (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/pricing'}
                className="flex items-center gap-2"
              >
                <span>Buy Credits</span>
              </Button>
            ),
          });
        } else {
          toast({
            title: "Credit deduction failed",
            description: result.error || "Unable to process credits. Please try again.",
            variant: "destructive",
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error('Credit deduction error:', error);
      toast({
        title: "Credit deduction failed",
        description: "Unable to process credits. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkCreditsAndWarn = (creditsNeeded: number, featureName: string): boolean => {
    if (creditsRemaining < creditsNeeded) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits to use ${featureName}. You have ${creditsRemaining} credits remaining.`,
        variant: "destructive",
        duration: 8000,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/pricing'}
            className="flex items-center gap-2"
          >
            <span>Buy Credits</span>
          </Button>
        ),
      });
      return false;
    }
    return true;
  };

  const startFreeTrial = async (): Promise<boolean> => {
    if (!user || trialUsed) return false;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ trial_used: true })
        .eq('id', user.id)
        .select('trial_used')
        .single();

      if (error) {
        console.error('Error starting trial:', error);
        toast({
          title: "Failed to start trial",
          description: "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      setTrialUsed(data?.trial_used || true);
      toast({
        title: "Free Trial Activated",
        description: "Enjoy premium features for a limited time!",
      });
      return true;
    } catch (error) {
      console.error('Failed to start free trial:', error);
      return false;
    }
  };

  const value = {
    user,
    loading: authLoading,
    isPremium,
    creditsRemaining,
    trialUsed,
    signOut,
    refreshSubscription,
    fetchUserProfile,
    checkCreditsAndWarn,
    startFreeTrial,
    deductUserCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
