import React, { useEffect, useState } from 'react';
import safeStorage from '@/utils/safeStorage';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visitor-ping`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const VISITOR_ID_KEY = 'pp_visitor_id';
const POLL_INTERVAL_MS = 30_000;

function getVisitorId(): string {
  let id = safeStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    safeStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

/**
 * Server-side live visitor counter. Pings the visitor-ping edge function
 * on mount and polls every 30s for the count of distinct visitors seen
 * in the last 5 minutes. Works regardless of hosting provider.
 */
const LiveVisitorBadge: React.FC = () => {
  const [live, setLive] = useState<number | null>(null);

  useEffect(() => {
    if (!FUNCTION_URL || !ANON_KEY) return;
    let cancelled = false;

    const ping = async () => {
      try {
        const res = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({
            visitor_id: getVisitorId(),
            path: window.location.pathname,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.live === 'number') {
          setLive(data.live);
        }
      } catch {
        // Counter is non-critical; stay hidden on failure.
      }
    };

    ping();
    const interval = window.setInterval(ping, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (live === null) return null;

  return (
    <span className="pp-trust-badge-item" role="status" aria-label={`${live} ${live === 1 ? 'person is' : 'people are'} on the site right now`}>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#22c55e',
          marginRight: 4,
        }}
      />
      {live} {live === 1 ? 'person' : 'people'} here now
    </span>
  );
};

export default LiveVisitorBadge;
