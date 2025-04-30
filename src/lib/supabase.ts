
import { createClient } from '@supabase/supabase-js';

// Use the provided Supabase URL and anonymous key
const supabaseUrl = 'https://ggpodadyycvmmxifqwlp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

// Create the Supabase client with automatic error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keep the session in localStorage
  },
});

// Helper function to handle function invocation errors
export const invokeSafeFunction = async (functionName: string, options?: any) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, options);
    
    if (error) {
      console.error(`Error invoking ${functionName}:`, error);
      throw new Error(error.message || `Failed to invoke ${functionName}`);
    }
    
    return { data, error: null };
  } catch (err) {
    console.error(`Exception in ${functionName}:`, err);
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : `Unknown error in ${functionName}`,
      },
    };
  }
};
