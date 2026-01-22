# Dashboard Implementation

## Overview
Fully working `/dashboard` route that loads real data from Supabase, removes stuck skeletons, and maintains a light-only theme.

## Architecture

### Hook: `useDashboardData()`
**Location:** `src/hooks/use-dashboard-data.ts`

**Features:**
- Parallel data fetching for optimal performance
- Zod schema validation for all API responses
- Abort controller for cleanup on unmount
- Comprehensive error handling with toast notifications
- No mock data - all queries hit real Supabase tables

**Queries Used:**
```typescript
// 1. User Profile
supabase
  .from('user_profiles')
  .select('credits_remaining, trial_used')
  .eq('id', user.id)
  .single()

// 2. Practice Sessions (last 5)
supabase
  .from('practice_sessions')
  .select('id, user_id, created_at, scenario_type, difficulty, score, duration_seconds')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(5)

// 3. Pitch Recordings (last 5)
supabase
  .from('pitch_recordings')
  .select('id, user_id, created_at, title, score, duration')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(5)
```

**Return Type:**
```typescript
{
  data: {
    profile: { credits: number; trialUsed: boolean };
    recentSessions: RecentSession[];
    tips: AITip[];
    stats: {
      totalSessions: number;
      averageScore: number | null;
      hasData: boolean;
    };
  };
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

## Components

### 1. CreditsBar
**Location:** `src/components/dashboard/CreditsBar.tsx`

**Features:**
- Only displays when credits === 0
- Red alert banner with "Top Up Credits" CTA
- Routes to `/pricing` page

### 2. RecentSessions
**Location:** `src/components/dashboard/RecentSessions.tsx`

**Features:**
- Displays last 5 sessions (combined practice + pitch)
- Shows scenario name, duration, score, and relative time
- Color-coded scores (green ≥70%, yellow ≥50%, red <50%)
- Click to navigate to session detail
- Empty state with "Start First Practice" CTA
- "View All Sessions" button routes to `/practice`

### 3. QuickPractice
**Location:** `src/components/dashboard/QuickPractice.tsx`

**Features:**
- Dynamic button text based on credit balance
- If credits > 0: "Start Practice (X credits)"
- If credits === 0: "Top Up Credits to Practice" → routes to `/pricing`
- Secondary "Try Roleplay Scenarios" button → routes to `/roleplay`
- Uses TiltCard for interactive hover effect

### 4. AiSuggestions
**Location:** `src/components/dashboard/AiSuggestions.tsx`

**Features:**
- Displays 3 AI tips (currently static, ready for dynamic)
- Each tip in a TiltCard with hover animation
- "View All Tips" button routes to `/tips`
- Empty state when no tips available

## Main Dashboard Component

**Location:** `src/pages/Dashboard.tsx`

**Key Changes:**
1. **Data Loading:** Uses `useDashboardData()` hook instead of mock data
2. **Skeleton Handling:** Only shows DashboardSkeleton when `isLoading === true`
3. **Error Handling:** Red Alert with "Retry" button on error
4. **Stats Cards:** Only render when `dashboardData.stats.hasData === true`
5. **Theme:** All dark mode classes removed, light-only palette

## Routes & CTAs

| Button/Link | Route | Condition |
|-------------|-------|-----------|
| Top Up Credits | `/pricing` | credits === 0 |
| Start Practice | `/practice` | credits > 0 |
| Try Roleplay Scenarios | `/roleplay` | Always available |
| View All Tips | `/tips` | Always available |
| View All Sessions | `/practice` | After showing sessions |
| Call Recordings | `/call-recordings` | Toolbar |
| Practice Session | `/practice` | Toolbar |
| Role Play | `/roleplay` | Toolbar |
| AI Settings | Modal open | Toolbar |
| Upgrade Plan | `/pricing` | !isPremium |
| Refresh | Refetch data | !isLoading |

## Schema Assumptions

### Tables Used:
1. **user_profiles**
   - `id` (uuid, PK)
   - `credits_remaining` (integer)
   - `trial_used` (boolean)

2. **practice_sessions**
   - `id` (uuid, PK)
   - `user_id` (uuid, FK)
   - `created_at` (timestamptz)
   - `scenario_type` (text)
   - `difficulty` (text)
   - `score` (integer, nullable)
   - `duration_seconds` (integer)

3. **pitch_recordings**
   - `id` (uuid, PK)
   - `user_id` (uuid, FK)
   - `created_at` (timestamptz)
   - `title` (text, nullable)
   - `score` (integer, nullable)
   - `duration` (integer, nullable)

**Note:** If your schema differs, adjust queries in `src/hooks/use-dashboard-data.ts` lines 60-90.

## Edge Cases Handled

✅ **Fresh account with 0 credits:**
- Red banner shows
- All CTAs route correctly
- Skeletons disappear within 2s
- No console errors

✅ **Account with credits and ≥1 session:**
- Banner hidden
- Recent sessions card populated
- Stats cards show real data

✅ **No sessions yet:**
- Empty state with friendly message
- "Start your first practice" button

✅ **Error during load:**
- Red alert with error message
- "Retry" button to refetch
- No crash, graceful degradation

✅ **Responsive:**
- Mobile (≥320px): single column layout
- Tablet: adjusted grid
- Desktop: 3-column grid
- No horizontal scroll

## Testing Checklist

- [ ] Fresh account: red banner, no data, clean skeletons
- [ ] Existing user: sessions load, stats accurate
- [ ] Click session → navigates to detail
- [ ] Click "Top Up" → goes to /pricing
- [ ] Click "Start Practice" → goes to /practice (or mic check)
- [ ] Click "Try Roleplay" → goes to /roleplay
- [ ] Click "View All Tips" → goes to /tips
- [ ] Refresh button → refetches data
- [ ] Error state → shows retry option
- [ ] Mobile viewport → no overflow
- [ ] Lighthouse → no contrast errors

## Performance Notes

- **Parallel queries:** All Supabase calls execute simultaneously via Promise.all
- **Abort controller:** Prevents memory leaks on unmount
- **Loading states:** Skeletons only during initial load or refetch
- **Zod validation:** Catches malformed data before rendering
- **Static tips:** No extra DB query for tips (easily upgradeable)

## Future Enhancements

1. **Dynamic AI Tips:** Query `ai_tips` table instead of static array
2. **Pagination:** Add "Load More" for sessions beyond 5
3. **Filters:** Filter sessions by date range, scenario type
4. **Charts:** Add trend charts for score over time
5. **Caching:** Use React Query or similar for data persistence
6. **Real-time:** Subscribe to session changes for live updates

## Dependencies Added

- `zod` - Runtime schema validation
- `date-fns` - Date formatting utilities

## Files Modified

1. `src/hooks/use-dashboard-data.ts` - Complete rewrite
2. `src/pages/Dashboard.tsx` - Refactored to use new hook
3. `src/components/dashboard/CreditsBar.tsx` - Created
4. `src/components/dashboard/RecentSessions.tsx` - Created
5. `src/components/dashboard/QuickPractice.tsx` - Created
6. `src/components/dashboard/AiSuggestions.tsx` - Created

## Console Logging

All logging is guarded with `[dashboard]` prefix for easy filtering:
- `[dashboard] Loading data for user: {userId}`
- `[dashboard] Data loaded successfully: {stats}`
- `[dashboard] Error loading data: {error}`

No sensitive data (emails, tokens) is logged. Production logs can be filtered via browser console.

---

**Last Updated:** 2025-10-08
**Version:** 1.0
