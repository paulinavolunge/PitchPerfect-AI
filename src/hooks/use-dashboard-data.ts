
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
        // Load pitch recordings
        const { data: pitchData, error: pitchError } = await supabase
          .from('pitch_recordings')
          .select('*')
          .eq('user_id', user.id)
          .limit(10);

        // Load practice sessions (objection handling, etc.)
        const { data: sessionData, error: sessionError } = await supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10);
          
        let totalPractices = 0;
        let totalScore = 0;
        let scoredCount = 0;
        let hasAnyData = false;

        // Process pitch recordings
        if (!pitchError && pitchData?.length > 0) {
          totalPractices += pitchData.length;
          hasAnyData = true;
          
          const scoredPitches = pitchData.filter(p => p.score !== null);
          scoredPitches.forEach(p => {
            if (p.score) {
              totalScore += p.score;
              scoredCount++;
            }
          });
        }

        // Process practice sessions
        if (!sessionError && sessionData?.length > 0) {
          totalPractices += sessionData.length;
          hasAnyData = true;
          
          const scoredSessions = sessionData.filter(s => s.score !== null);
          scoredSessions.forEach(s => {
            if (s.score) {
              totalScore += s.score;
              scoredCount++;
            }
          });
        }

        // Update dashboard data
        newDashboardData.pitchCount = totalPractices;
        newDashboardData.hasData = hasAnyData;
        
        // Calculate overall win rate from both sources
        if (scoredCount > 0) {
          const averageScore = totalScore / scoredCount;
          newDashboardData.winRate = Math.round(averageScore);
        }

      } catch (dataError) {
        console.log('Could not load practice data, using defaults:', dataError);
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
