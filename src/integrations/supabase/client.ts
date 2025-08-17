import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const message = '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY';
  if (import.meta.env.PROD) {
    throw new Error(message);
  } else {
    console.warn(message);
  }
}

export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try { return window.localStorage.getItem(key); } catch { return null; }
      },
      setItem: (key: string, value: string) => {
        try { window.localStorage.setItem(key, value); } catch {}
      },
      removeItem: (key: string) => {
        try { window.localStorage.removeItem(key); } catch {}
      },
    },
  },
  global: { headers: { 'x-application-name': 'pitchperfect-ai' } }
})