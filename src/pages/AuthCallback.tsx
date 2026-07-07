import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * OAuth callback handler.
 * Exchanges the PKCE `?code=` for a session, then redirects into the app.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const url = window.location.href;
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorDesc = params.get('error_description') || params.get('error');

        if (errorDesc) {
          toast.error('Sign-in failed', { description: errorDesc });
          navigate('/login', { replace: true });
          return;
        }

        if (code) {
          // detectSessionInUrl: true means supabase-js may have already
          // auto-exchanged this code. Only exchange manually if no session
          // exists yet, and treat "verifier not found" as a lost race with
          // the auto-exchange rather than a real failure.
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (!existingSession) {
            const { error } = await supabase.auth.exchangeCodeForSession(url);
            if (error) {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (!retrySession) {
                console.error('[AuthCallback] exchangeCodeForSession error:', error);
                toast.error('Sign-in failed', { description: error.message });
                navigate('/login', { replace: true });
                return;
              }
            }
          }
        }

        // Clean the URL and route into the app
        const stored = sessionStorage.getItem('postLoginRedirect');
        sessionStorage.removeItem('postLoginRedirect');
        navigate(stored || '/practice', { replace: true });
      } catch (err: any) {
        console.error('[AuthCallback] unexpected error:', err);
        toast.error('Sign-in failed', { description: err?.message || 'Unexpected error' });
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}
