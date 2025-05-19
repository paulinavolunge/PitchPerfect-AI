
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/utils/analytics";

export interface DashboardSettings {
  activeTab: string;
  timeRange: 'week' | 'month' | 'quarter';
  showTeamStats: boolean;
}

export interface DashboardData {
  pitchCount: number;
  winRate: number | null;
  recentPitches: { name: string; count: number }[];
  objectionCategories: { category: string; mastered: number }[];
  hasData: boolean;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [streakCount, setStreakCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pitchCount: 0,
    winRate: null,
    recentPitches: [],
    objectionCategories: [],
    hasData: false
  });
  
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
      
      if (streakError && streakError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching streak data:', streakError);
      } else if (streakData) {
        setStreakCount(streakData.current_streak || 0);
      }

      // In a real app, we'd fetch the user's actual pitch data
      // For now we'll simulate fetching user-specific data
      const { data: pitchData, error: pitchError } = await supabase
        .from('pitch_sessions')
        .select('*')
        .eq('user_id', user.id);
        
      if (pitchError) {
        console.error('Error fetching pitch data:', pitchError);
      }
      
      // Default empty data
      let newDashboardData = {
        pitchCount: 0,
        winRate: null,
        recentPitches: [
          { name: 'Mon', count: 0 },
          { name: 'Tue', count: 0 },
          { name: 'Wed', count: 0 },
          { name: 'Thu', count: 0 },
          { name: 'Fri', count: 0 },
          { name: 'Sat', count: 0 },
          { name: 'Sun', count: 0 },
        ],
        objectionCategories: [
          { category: 'Price', mastered: 0 },
          { category: 'Timing', mastered: 0 },
          { category: 'Competition', mastered: 0 },
          { category: 'Need', mastered: 0 },
        ],
        hasData: false
      };
      
      // If we have pitch data, populate the dashboard
      if (pitchData && pitchData.length > 0) {
        // Calculate pitch count
        newDashboardData.pitchCount = pitchData.length;
        
        // Calculate win rate if available
        const winCount = pitchData.filter(p => p.outcome === 'success').length;
        if (pitchData.length > 0) {
          newDashboardData.winRate = Math.round((winCount / pitchData.length) * 100);
        }
        
        // Calculate recent pitch activity (simplified, in a real app we'd group by day)
        // This is a placeholder implementation
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCount = new Array(7).fill(0);
        
        pitchData.forEach(pitch => {
          const pitchDate = new Date(pitch.created_at);
          const dayDiff = Math.floor((today.getTime() - pitchDate.getTime()) / (24 * 60 * 60 * 1000));
          if (dayDiff < 7) {
            const dayIndex = (today.getDay() - dayDiff + 7) % 7;
            dayCount[dayIndex]++;
          }
        });
        
        newDashboardData.recentPitches = dayNames.map((name, index) => ({
          name,
          count: dayCount[(index + today.getDay() + 1) % 7]
        }));
        
        // Flag that we have data
        newDashboardData.hasData = true;
      }
      
      setDashboardData(newDashboardData);
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
    dashboardData,
    updateSettings,
    refreshDashboardData
  };
}
