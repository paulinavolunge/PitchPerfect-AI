import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Prefer environment variables; fall back to public anon defaults for local/dev/test
const DEFAULT_URL = 'https://ggpodadyycvmmxifqwlp.supabase.co';
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;

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