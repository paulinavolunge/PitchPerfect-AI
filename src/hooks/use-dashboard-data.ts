
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
    if (typeof window === 'undefined') {
      return { activeTab: 'overview', timeRange: 'month', showTeamStats: true };
    }
    
    try {
      const storedSettings = localStorage.getItem('dashboardSettings');
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (e) {
      console.error('Error parsing dashboard settings from localStorage', e);
    }
    
    return { activeTab: 'overview', timeRange: 'month', showTeamStats: true };
  }, []);

  const [settings, setSettings] = useState<DashboardSettings>(getStoredSettings());

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<DashboardSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboardSettings', JSON.stringify(updatedSettings));
      }
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
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    if (showAnimation) {
      setIsRefreshing(true);
    }
    
    setIsLoading(true);
    
    try {
      // Simplified data loading - just set mock data for now
      setStreakCount(Math.floor(Math.random() * 10));
      
      // Default data structure
      const newDashboardData = {
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
      
      // Try to load actual data if possible
      try {
        const { data: pitchData, error: pitchError } = await supabase
          .from('pitch_recordings')
          .select('*')
          .eq('user_id', user.id)
          .limit(10);
          
        if (!pitchError && pitchData?.length > 0) {
          newDashboardData.pitchCount = pitchData.length;
          newDashboardData.hasData = true;
          
          // Calculate win rate if scores available
          const scoredPitches = pitchData.filter(p => p.score !== null);
          if (scoredPitches.length > 0) {
            const highScorePitches = scoredPitches.filter(p => p.score && p.score >= 70);
            newDashboardData.winRate = Math.round((highScorePitches.length / scoredPitches.length) * 100);
          }
        }
      } catch (dataError) {
        console.log('Could not load pitch data, using defaults:', dataError);
      }
      
      setDashboardData(newDashboardData);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsLoading(false);
      
      if (showAnimation) {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }
    }
  }, [user]);

  // Initialize data when dashboard loads
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await refreshDashboardData(false);
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
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
