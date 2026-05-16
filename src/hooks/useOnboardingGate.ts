/**
 * useOnboardingGate — redirect authenticated users with no saved role to /onboarding.
 *
 * Mount this hook once inside the Dashboard component (or any protected page that
 * is the typical post-signup landing). The gate fires exactly once: as soon as a
 * role is written to user_profiles (via the onboarding screen or the skip action),
 * subsequent visits will find a non-null role and pass through silently.
 */
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Pages where the gate must never redirect (would create a redirect loop or
// interrupt a flow the user explicitly navigated to).
const GATE_EXEMPT_PATHS = ["/onboarding", "/login", "/signup", "/password-reset"];

export function useOnboardingGate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkedRef = useRef(false); // avoid double-check on StrictMode re-render

  useEffect(() => {
    if (loading || !user?.id || checkedRef.current) return;
    if (GATE_EXEMPT_PATHS.some((p) => location.pathname.startsWith(p))) return;

    checkedRef.current = true;

    supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) return; // non-critical: don't block existing users on a DB error
        if (!data?.role) {
          // Preserve the intended destination so we can redirect back after onboarding
          navigate("/onboarding", {
            replace: true,
            state: { returnTo: location.pathname + location.search },
          });
        }
      });
  }, [user?.id, loading, location.pathname, navigate]);
}
