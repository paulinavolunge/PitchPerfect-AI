
import { createClient } from '@supabase/supabase-js';

// Use the provided Supabase URL and anonymous key
const supabaseUrl = 'https://ggpodadyycvmmxifqwlp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
