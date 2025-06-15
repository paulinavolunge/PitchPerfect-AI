
// Only import createClient and types from supabase-js
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// DO NOT import @supabase/postgrest-js directly. If you ever need it, use:
// import * as postgrest from '@supabase/postgrest-js'

// Core Supabase configuration (do not wrap in try/catch, do not default-import cjs modules)
const supabaseUrl = 'https://ggpodadyycvmmxifqwlp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

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

// --- DEV-ONLY error detection for default-import postgrest bugs ---
if (
  typeof window !== "undefined" &&
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.MODE === "development"
) {
  // Check if we have any postgrest usage (paranoid!)
  try {
    // In dev mode: check window['postgrest'] for signs of incorrect import
    if (window && (window as any).postgrest) {
      // eslint-disable-next-line no-console
      console.error(
        "[Supabase Client] Detected global 'postgrest' object, likely caused by 'import postgrest from \"@supabase/postgrest-js\"', which is INVALID. Please use 'import * as postgrest from \"@supabase/postgrest-js\"' everywhere. Failing initialization."
      );
      // Throwing to halt app in dev so this is seen
      throw new Error(
        "[Supabase Client] Fatal: Incorrect 'default' import from '@supabase/postgrest-js' found. Check project for 'import postgrest from ...' and replace with 'import * as postgrest from ...'"
      );
    }
  } catch (_) { }
  if (!supabase || typeof supabase !== 'object' || !supabase.auth) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Client initialization failed:', supabase);
  } else {
    // eslint-disable-next-line no-console
    console.log('[Supabase] Client initialized:', supabase);
  }
}

// If more postgrest integration is ever needed, only use named or namespace imports, never default.

