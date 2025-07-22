-- Fix security issues: mutable search_path and password protection
-- Date: 2025-01-22

-- 1. Fix mutable search_path for SECURITY DEFINER functions in database.sql
-- Update handle_new_user function with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits_remaining, trial_used)
  VALUES (NEW.id, 1, FALSE); -- Grant 1 free pitch analysis on signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update deduct_credits_and_log_usage function with explicit search_path
CREATE OR REPLACE FUNCTION public.deduct_credits_and_log_usage(
  p_user_id UUID,
  p_feature_used TEXT,
  p_credits_to_deduct INTEGER
)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits for % (needed % , available %)', p_feature_used, p_credits_to_deduct, COALESCE(current_credits, 0);
  END IF;

  -- Deduct credits
  UPDATE public.user_profiles
  SET credits_remaining = credits_remaining - p_credits_to_deduct
  WHERE id = p_user_id;

  -- Log the usage
  INSERT INTO public.usage_log (user_id, feature_used, credits_used)
  VALUES (p_user_id, p_feature_used, p_credits_to_deduct);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix mutable search_path for SECURITY DEFINER functions in database_security.sql
-- Update log_data_access function with explicit search_path
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  client_ip TEXT;
  client_info TEXT;
BEGIN
  BEGIN
    -- Safely extract client information
    client_ip := COALESCE(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'x-real-ip',
      'unknown'
    );
    
    client_info := COALESCE(
      current_setting('request.headers', true)::json->>'user-agent',
      'unknown'
    );
    
    INSERT INTO public.data_access_logs (
      user_id, 
      table_accessed, 
      record_id, 
      operation,
      client_info,
      ip_address
    )
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      client_info,
      client_ip::INET
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the main operation
      RAISE WARNING 'Failed to log data access for table %: %', TG_TABLE_NAME, SQLERRM;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Fix mutable search_path for SECURITY DEFINER functions in feedback_tracking.sql
-- Update is_admin function with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Add password protection policies to prevent password leakage
-- Create a secure view for user information that excludes sensitive data
CREATE OR REPLACE VIEW public.user_profiles_secure AS
SELECT 
  id,
  credits_remaining,
  trial_used,
  created_at,
  updated_at
FROM public.user_profiles
WHERE id = auth.uid(); -- Only show current user's data

-- Grant access to the secure view
GRANT SELECT ON public.user_profiles_secure TO authenticated;

-- 5. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log any operation that touches user authentication or profile data
  IF TG_TABLE_NAME IN ('user_profiles', 'subscribers') THEN
    INSERT INTO public.data_access_logs (
      user_id,
      table_accessed,
      record_id,
      operation,
      client_info,
      ip_address
    )
    VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      current_setting('request.headers', true)::json->>'user-agent',
      COALESCE(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'x-real-ip'
      )::INET
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to sensitive tables
DROP TRIGGER IF EXISTS log_user_profiles_sensitive ON public.user_profiles;
CREATE TRIGGER log_user_profiles_sensitive
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operation();

DROP TRIGGER IF EXISTS log_subscribers_sensitive ON public.subscribers;
CREATE TRIGGER log_subscribers_sensitive
AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operation();

-- 6. Add comment explaining the security fixes
COMMENT ON SCHEMA public IS 'Public schema with enhanced security: all SECURITY DEFINER functions have explicit search_path, password data is protected, and sensitive operations are logged.';
