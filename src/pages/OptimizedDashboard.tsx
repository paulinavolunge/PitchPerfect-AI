// Optimized Dashboard component with performance improvements
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { debounce } from 'lodash';

// Import available components directly
import DashboardStats from '@/components/DashboardStats';
import MilestoneTracker from '@/components/gamification/MilestoneTracker';
import StreakBadge from '@/components/dashboard/StreakBadge';

// Constants outside component to prevent recreation
const TOUR_STORAGE_KEY = 'pitchPerfectTourCompleted';
const TOUR_COOLDOWN_KEY = 'pitchPerfectTourCooldown';
const TOUR_COOLDOWN_HOURS = 24;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface DashboardData {
  pitchCount: number;
  winRate: number | null;
  recentPitches: Array<{ name: string; count: number }>;
  objectionCategories: Array<{ category: string; mastered: number }>;
  hasData: boolean;
}

export default function OptimizedDashboard() {
  const { user, loading, creditsRemaining, trialUsed, isPremium, isNewUser, markOnboardingComplete } = useAuth();
  
  // Use refs for values that don't need to trigger re-renders
  const cacheRef = useRef<{ data: DashboardData; timestamp: number } | null>(null);
  const loadingRef = useRef(false);
  
  // Batch state updates
  const [state, setState] = useState({
    showTour: false,
    showMicTest: false,
    tourCompleted: false,
    showAISettings: false,
    showOnboarding: false,
    activeTab: 'overview',
    isLoading: true,
    isRefreshing: false,
    streakCount: 0,
    dashboardData: {
      pitchCount: 0,
      winRate: null,
      recentPitches: [],
      objectionCategories: [
        { category: 'Price', mastered: 0 },
        { category: 'Timing', mastered: 0 },
        { category: 'Competition', mastered: 0 },
        { category: 'Need', mastered: 0 },
      ],
      hasData: false
    } as DashboardData
  });

  // Memoized update function to batch state changes
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoized check functions
  const micCheckRequired = useMemo(() => {
    const lastMicCheck = localStorage.getItem('lastMicCheck');
    if (!lastMicCheck) return true;
    const daysSinceCheck = (Date.now() - parseInt(lastMicCheck)) / (1000 * 60 * 60 * 24);
    return daysSinceCheck > 7;
  }, []);

  const canShowTour = useMemo(() => {
    const cooldownTime = localStorage.getItem(TOUR_COOLDOWN_KEY);
    if (!cooldownTime) return true;
    const hoursSinceCooldown = (Date.now() - parseInt(cooldownTime)) / (1000 * 60 * 60);
    return hoursSinceCooldown > TOUR_COOLDOWN_HOURS;
  }, []);

  // Debounced data loading function
  const loadDashboardData = useCallback(
    debounce(async () => {
      // Check cache first
      if (cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
        updateState({
          dashboardData: cacheRef.current.data,
          isLoading: false
        });
        return;
      }

      // Prevent duplicate requests
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        // Simulate async data loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newData: DashboardData = {
          pitchCount: user ? Math.floor(Math.random() * 5) : 0,
          winRate: user ? Math.floor(Math.random() * 100) : null,
          recentPitches: [
            { name: 'Mon', count: Math.floor(Math.random() * 5) },
            { name: 'Tue', count: Math.floor(Math.random() * 5) },
            { name: 'Wed', count: Math.floor(Math.random() * 5) },
            { name: 'Thu', count: Math.floor(Math.random() * 5) },
            { name: 'Fri', count: Math.floor(Math.random() * 5) },
            { name: 'Sat', count: Math.floor(Math.random() * 5) },
            { name: 'Sun', count: Math.floor(Math.random() * 5) },
          ],
          objectionCategories: [
            { category: 'Price', mastered: Math.floor(Math.random() * 100) },
            { category: 'Timing', mastered: Math.floor(Math.random() * 100) },
            { category: 'Competition', mastered: Math.floor(Math.random() * 100) },
            { category: 'Need', mastered: Math.floor(Math.random() * 100) },
          ],
          hasData: !!user
        };

        // Update cache
        cacheRef.current = { data: newData, timestamp: Date.now() };

        updateState({
          dashboardData: newData,
          streakCount: Math.floor(Math.random() * 10),
          isLoading: false
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        updateState({ isLoading: false });
      } finally {
        loadingRef.current = false;
      }
    }, 300),
    [user, updateState]
  );

  // Effect for loading data
  useEffect(() => {
    if (!loading) {
      loadDashboardData();
    }
  }, [loading, loadDashboardData]);

  // Memoized handlers
  const handleRefresh = useCallback(async () => {
    updateState({ isRefreshing: true });
    cacheRef.current = null; // Clear cache
    await loadDashboardData();
    updateState({ isRefreshing: false });
  }, [loadDashboardData, updateState]);

  const handleTabChange = useCallback((tab: string) => {
    updateState({ activeTab: tab });
  }, [updateState]);

  // Memoized render sections
  const renderContent = useMemo(() => {
    if (state.isLoading) {
      return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
      <React.Suspense fallback={<div>Loading components...</div>}>
        {state.activeTab === 'overview' && (
          <DashboardStats />
        )}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <StreakBadge streakCount={state.streakCount || 0} />
          <MilestoneTracker milestone={{ 
            id: 'first_practice', 
            title: 'Complete First Practice', 
            description: 'Complete your first practice session', 
            targetValue: 1,
            currentValue: 0
          }} />
        </div>
      </React.Suspense>
    );
  }, [state.isLoading, state.activeTab, state.dashboardData, state.isRefreshing, state.streakCount, handleRefresh]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your progress and improve your pitch</p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => handleTabChange('overview')}
              className={`px-4 py-2 rounded-md ${
                state.activeTab === 'overview' 
                  ? 'bg-brand-green text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`px-4 py-2 rounded-md ${
                state.activeTab === 'analytics' 
                  ? 'bg-brand-green text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {renderContent}
      </div>
    </div>
  );
}
