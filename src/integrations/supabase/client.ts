import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import safeStorage from '@/utils/safeStorage'

// Use environment variables - these are public keys safe for client-side
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate configuration at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing configuration. Check environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://ggpodadyycvmmxifqwlp.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Use safe storage that handles private browsing mode
      storage: {
        getItem: (key: string) => safeStorage.getItem(key),
        setItem: (key: string, value: string) => safeStorage.setItem(key, value),
        removeItem: (key: string) => safeStorage.removeItem(key),
      },
    },
    global: {
      headers: {
        'x-application-name': 'pitchperfect-ai'
      }
    }
  }
)
