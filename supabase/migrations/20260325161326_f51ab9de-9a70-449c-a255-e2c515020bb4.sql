-- Attach the existing protect_billing_fields function as a BEFORE UPDATE trigger
CREATE TRIGGER protect_billing_fields
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_billing_fields();