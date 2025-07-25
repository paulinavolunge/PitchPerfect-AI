-- RLS Policy Coverage Audit for PitchPerfect AI
-- This script audits all tables to ensure proper RLS policies are in place

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check tables without RLS policies
SELECT DISTINCT
  t.schemaname,
  t.tablename,
  'Missing RLS policies' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true 
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- List all current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables missing basic CRUD policies
WITH table_policies AS (
  SELECT 
    tablename,
    array_agg(cmd) as commands
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
  CASE 
    WHEN 'SELECT' = ANY(p.commands) THEN '✓' 
    ELSE '✗' 
  END as has_select,
  CASE 
    WHEN 'INSERT' = ANY(p.commands) THEN '✓' 
    ELSE '✗' 
  END as has_insert,
  CASE 
    WHEN 'UPDATE' = ANY(p.commands) THEN '✓' 
    ELSE '✗' 
  END as has_update,
  CASE 
    WHEN 'DELETE' = ANY(p.commands) THEN '✓' 
    ELSE '✗' 
  END as has_delete
FROM all_tables t
LEFT JOIN table_policies p ON t.tablename = p.tablename
ORDER BY t.tablename;

-- Check for overly permissive policies (policies that might allow too much access)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  'Potentially overly permissive' as warning
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%true%' 
    OR qual ILIKE '%1=1%'
    OR qual IS NULL
  )
  AND cmd != 'INSERT'
ORDER BY tablename, policyname;

-- Security functions audit
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '⚠️  Security Definer - Review carefully'
    ELSE '✓ Normal function'
  END as security_note
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%security%' 
  OR routine_name LIKE '%admin%'
  OR routine_name LIKE '%auth%'
ORDER BY routine_name;

-- Check for functions that bypass RLS
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef THEN '⚠️  SECURITY DEFINER - Can bypass RLS'
    ELSE '✓ Normal function'
  END as security_status,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;

-- Summary report
WITH policy_count AS (
  SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public'
),
table_count AS (
  SELECT COUNT(*) as total_tables FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
),
issues AS (
  SELECT COUNT(*) as tables_without_policies
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
  'SECURITY AUDIT SUMMARY' as report_section,
  tc.total_tables as tables_with_rls,
  pc.total_policies as total_policies,
  i.tables_without_policies as tables_missing_policies,
  CASE 
    WHEN i.tables_without_policies = 0 THEN '✓ All tables have policies'
    ELSE '⚠️  Some tables missing policies'
  END as status
FROM table_count tc, policy_count pc, issues i;