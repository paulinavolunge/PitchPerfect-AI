-- Phase 1: Critical Data Exposure Fixes

-- 1.1 Fix auth_rate_limits Email Exposure
-- Remove overly permissive "Authenticated users only" SELECT policy
DROP POLICY IF EXISTS "Authenticated users only" ON public.auth_rate_limits;

-- 1.2 Fix login_events INSERT Validation
-- Drop unsafe policy that allows inserting with arbitrary user_id
DROP POLICY IF EXISTS "Allow insert by authenticated users" ON public.login_events;

-- Create secure policy that validates user_id matches authenticated user
CREATE POLICY "users_insert_own_login_events" 
ON public.login_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 1.3 Fix security_logs Anonymous Insertion
-- Drop unsafe policies that allow NULL user_id
DROP POLICY IF EXISTS "Users can insert their own security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Users can view their own security logs" ON public.security_logs;

-- Create secure policies requiring valid user_id
CREATE POLICY "users_insert_own_security_logs" 
ON public.security_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_view_own_security_logs" 
ON public.security_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Phase 2: Remove Redundant Blanket Policies
-- Remove "Authenticated users only" policies from tables with more specific policies
DROP POLICY IF EXISTS "Authenticated users only" ON public.role_change_log;
DROP POLICY IF EXISTS "Authenticated users only" ON public.security_events;
DROP POLICY IF EXISTS "Authenticated users only" ON public.security_audit_summary;
DROP POLICY IF EXISTS "Authenticated users only" ON public.usage_log;
DROP POLICY IF EXISTS "Authenticated users only" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users only" ON public.voice_rate_limits;
DROP POLICY IF EXISTS "Authenticated users only" ON public.sales_scripts;
DROP POLICY IF EXISTS "Authenticated users only" ON public.pitch_recordings;
DROP POLICY IF EXISTS "Authenticated users only" ON public.user_performance;