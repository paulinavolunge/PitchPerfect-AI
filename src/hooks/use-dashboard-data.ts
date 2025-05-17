import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/utils/analytics";

export interface DashboardSettings {
  activeTab: string;
  timeRange: 'week' | 'month' | 'quarter';
  showTeamStats: boolean;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [streakCount, setStreakCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get settings from localStorage or use defaults
  const getStoredSettings = useCallback((): DashboardSettings => {
    if (typeof localStorage === 'undefined') {
      return { activeTab: 'overview', timeRange: 'month', showTeamStats: true };
    }
    
    const storedSettings = localStorage.getItem('dashboardSettings');
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings);
      } catch (e) {
        console.error('Error parsing dashboard settings from localStorage', e);
      }
    }
    
    return { activeTab: 'overview', timeRange: 'month', showTeamStats: true };
  }, []);

  const [settings, setSettings] = useState<DashboardSettings>(getStoredSettings());

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem('dashboardSettings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.error('Error saving dashboard settings to localStorage', e);
    }
    
    // Track settings change
    trackEvent('dashboard_settings_updated', {
      event_category: 'user_preference',
      settings: Object.keys(newSettings).join(',')
    });
  }, [settings]);

  // Function to refresh dashboard data
  const refreshDashboardData = useCallback(async (showAnimation = true) => {
    if (!user) return;
    
    if (showAnimation) {
      setIsRefreshing(true);
    }
    
    setIsLoading(true);
    
    try {
      // Fetch streak data
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();
      
      if (streakError) {
        console.error('Error fetching streak data:', streakError);
      } else if (streakData) {
        setStreakCount(streakData.current_streak || 0);
      }

      // Here you would fetch other dashboard data...
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsLoading(false);
      
      if (showAnimation) {
        // Keep the refreshing state visible for at least 500ms so the animation is noticeable
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }
    }
  }, [user]);

  // Initialize data when dashboard loads
  useEffect(() => {
    // Check if we're returning from a practice session
    const returningFromPractice = sessionStorage.getItem('completedPractice');
    
    if (returningFromPractice) {
      // Clear the flag
      sessionStorage.removeItem('completedPractice');
      // Refresh with animation
      refreshDashboardData(true);
    } else {
      // Normal load without animation
      refreshDashboardData(false);
    }
  }, [refreshDashboardData]);

  return {
    isLoading,
    isRefreshing,
    lastRefreshed,
    streakCount,
    settings,
    updateSettings,
    refreshDashboardData
  };
}
