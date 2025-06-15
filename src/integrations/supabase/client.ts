
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

try {
  // Use the actual Supabase project configuration
  const supabaseUrl = 'https://ggpodadyycvmmxifqwlp.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY'

  export const supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'pitchperfect-ai'
        }
      }
    }
  )
  // Debug: verify client object shape
  if (!supabase || typeof supabase !== 'object' || !supabase.auth) {
    // Should never happen, but log
    // eslint-disable-next-line no-console
    console.error('[Supabase] Client initialization failed:', supabase);
    throw new Error('Supabase client failed to initialize');
  } else {
    // eslint-disable-next-line no-console
    console.log('[Supabase] Client initialized:', supabase);
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[Supabase] Fatal error loading client:', err);
  throw err; // causes main.tsx error boundary to display UI
}

