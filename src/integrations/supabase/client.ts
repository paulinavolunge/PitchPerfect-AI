
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

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
);

// Debug: verify client object shape (only in development)
if (
  typeof window !== "undefined" &&
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.MODE === "development"
) {
  if (!supabase || typeof supabase !== 'object' || !supabase.auth) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Client initialization failed:', supabase);
  } else {
    // eslint-disable-next-line no-console
    console.log('[Supabase] Client initialized:', supabase);
  }
}
