-- Supabase RLS Audit Script
-- This script audits all tables for Row Level Security (RLS) configuration

-- ✅ 1. Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS Disabled'
  END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ✅ 2. Check tables without RLS policies
SELECT DISTINCT
  t.schemaname,
  t.tablename,
  'Missing RLS policies' AS issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true 
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- ✅ 3. Check for tables without RLS enabled (potential security risk)
SELECT 
  schemaname,
  tablename,
  'WARNING: RLS not enabled' AS security_status
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public' 
AND NOT rowsecurity
ORDER BY tablename;

-- ✅ 4. Check for tables with RLS enabled but no policies (inaccessible data)
SELECT DISTINCT
  t.schemaname,
  t.tablename,
  'WARNING: RLS enabled but no policies found' AS security_status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public' 
  AND c.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- ✅ 5. Audit specific tables that should exist and have proper RLS
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'subscribers', 
    'user_profiles', 
    'usage_log', 
    'pitch_recordings', 
    'user_performance', 
    'data_access_logs',
    'feedback_sessions',
    'practice_sessions'
  ]) AS table_name
)
SELECT 
  et.table_name,
  CASE 
    WHEN t.tablename IS NULL THEN 'TABLE MISSING'
    WHEN NOT c.rowsecurity THEN 'RLS DISABLED'
    WHEN p.policyname IS NULL THEN 'NO POLICIES'
    ELSE 'RLS CONFIGURED'
  END AS rls_status,
  COUNT(p.policyname) AS policy_count
FROM expected_tables et
LEFT JOIN pg_tables t ON t.tablename = et.table_name AND t.schemaname = 'public'
LEFT JOIN pg_class c ON c.relname = et.table_name
LEFT JOIN pg_policies p ON p.tablename = et.table_name AND p.schemaname = 'public'
GROUP BY et.table_name, t.tablename, c.rowsecurity, 
  CASE 
    WHEN t.tablename IS NULL THEN 'TABLE MISSING'
    WHEN NOT c.rowsecurity THEN 'RLS DISABLED'
    WHEN p.policyname IS NULL THEN 'NO POLICIES'
    ELSE 'RLS CONFIGURED'
  END
ORDER BY et.table_name;

-- ✅ 6. Check for tables missing basic CRUD policies
WITH table_policies AS (
  SELECT 
    tablename,
    array_agg(cmd) AS commands
  FROM pg_policies 
  WHERE schemaname = 'public'
  GROUP BY tablename
),
all_tables AS (
  SELECT tablename 
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = true
)
SELECT 
  t.tablename,
  CASE WHEN 'SELECT' = ANY(p.commands) THEN '✓' ELSE '✗' END AS has_select,
  CASE WHEN 'INSERT' = ANY(p.commands) THEN '✓' ELSE '✗' END AS has_insert,
  CASE WHEN 'UPDATE' = ANY(p.commands) THEN '✓' ELSE '✗' END AS has_update,
  CASE WHEN 'DELETE' = ANY(p.commands) THEN '✓' ELSE '✗' END AS has_delete
FROM all_tables t
LEFT JOIN table_policies p ON t.tablename = p.tablename
ORDER BY t.tablename;

-- ✅ 7. Check for overly permissive policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  'WARNING: Potentially permissive policy' AS security_concern,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%true%' 
    OR qual ILIKE '%1=1%'
    OR qual IS NULL
  )
ORDER BY tablename, policyname;

-- ✅ 8. List all current RLS policies for public schema
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ✅ 9. Check for auth.uid() usage in policies (recommended)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%' THEN 'USES auth.uid()'
    ELSE 'NO auth.uid() FOUND'
  END AS auth_pattern,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ✅ 10. Check for foreign key constraints that should align with RLS policies
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  'Check if RLS policies align with FK relationships' AS recommendation
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ✅ 11. Check for SECURITY DEFINER functions that could bypass RLS
SELECT 
  p.proname AS function_name,
  CASE 
    WHEN p.prosecdef THEN '⚠️  SECURITY DEFINER - Can bypass RLS'
    ELSE '✓ Normal function'
  END AS security_status,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- ✅ 12. Security functions audit
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '⚠️  Security Definer - Review carefully'
    ELSE '✓ Normal function'
  END AS security_note
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_name ILIKE '%security%' 
    OR routine_name ILIKE '%admin%' 
    OR routine_name ILIKE '%auth%'
  )
ORDER BY routine_name;

-- ✅ 13. Final Summary
WITH policy_count AS (
  SELECT COUNT(*) AS total_policies FROM pg_policies WHERE schemaname = 'public'
),
table_count AS (
  SELECT COUNT(*) AS total_tables FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
),
issues AS (
  SELECT COUNT(*) AS tables_without_policies
  FROM (
    SELECT DISTINCT t.tablename
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public' 
      AND t.rowsecurity = true 
      AND p.policyname IS NULL
  ) sub
)
SELECT 
  'SECURITY AUDIT SUMMARY' AS report_section,
  tc.total_tables AS tables_with_rls,
  pc.total_policies AS total_policies,
  i.tables_without_policies AS tables_missing_policies,
  CASE 
    WHEN i.tables_without_policies = 0 THEN '✓ All tables have policies'
    ELSE '⚠️  Some tables missing policies'
  END AS status
FROM table_count tc, policy_count pc, issues i;

