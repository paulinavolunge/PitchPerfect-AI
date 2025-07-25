-- Supabase RLS Audit Script
-- This script audits all tables for Row Level Security (RLS) configuration

-- 1. Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    pg_catalog.obj_description(oid) AS table_comment
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all RLS policies for public schema tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check for tables without RLS enabled (potential security risk)
SELECT 
    schemaname,
    tablename,
    'WARNING: RLS not enabled' AS security_status
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public' 
AND NOT rowsecurity
ORDER BY tablename;

-- 4. Check for tables with RLS enabled but no policies (inaccessible data)
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

-- 5. Audit specific tables that should exist and have proper RLS
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

-- 6. Check for policies that might be too permissive
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

-- 7. Summary report
SELECT 
    'AUDIT SUMMARY' AS report_section,
    COUNT(*) AS total_public_tables,
    COUNT(CASE WHEN c.rowsecurity THEN 1 END) AS tables_with_rls,
    COUNT(CASE WHEN NOT c.rowsecurity THEN 1 END) AS tables_without_rls,
    ROUND(
        COUNT(CASE WHEN c.rowsecurity THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) AS rls_coverage_percentage
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public';

-- 8. Detailed policy analysis
SELECT 
    tablename,
    COUNT(*) AS total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) AS select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) AS insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) AS update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) AS delete_policies,
    COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) AS all_operation_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 9. Check for auth.uid() usage in policies (recommended pattern)
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

-- 10. Check for foreign key constraints that should align with RLS policies
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
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;