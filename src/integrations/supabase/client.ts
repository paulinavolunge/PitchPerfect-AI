import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing configuration: URL or Anon Key');
  throw new Error('Supabase configuration is missing');
}

// Only log in development mode, never in production
if (import.meta.env.DEV) {
  console.log('[Supabase] Initializing client');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch (error) {
          console.warn('[Supabase] Failed to get item from localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          window.localStorage.setItem(key, value);
        } catch (error) {
          console.warn('[Supabase] Failed to set item in localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          console.warn('[Supabase] Failed to remove item from localStorage:', error);
        }
      },
    },
  },
  global: {
    headers: {
      'x-application-name': 'pitchperfect-ai'
    }
  }
})

// Only log in development mode
if (import.meta.env.DEV) {
  console.log('[Supabase] Client initialized successfully');
}