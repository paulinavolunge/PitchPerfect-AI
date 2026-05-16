/**
 * daily-streak-job — runs nightly at 00:05 UTC via pg_cron
 *
 * For every user who had a non-zero streak but didn't practice
 * during the UTC day that just ended:
 *   • If streak_freezes_available > 0  → auto-apply freeze (Gong pattern)
 *   • Otherwise                        → insert 'broken' event (streak resets to 0)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  // Only callable by pg_cron via a shared secret
  const cronSecret = Deno.env.get('CRON_SECRET');
  const auth = req.headers.get('Authorization') ?? '';
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // UTC date that just ended (yesterday from the job's perspective)
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const ydStr = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD

  // Fetch all profiles that have streak-relevant data
  const { data: profiles, error: profErr } = await supabase
    .from('user_profiles')
    .select('id, timezone, streak_freezes_available');

  if (profErr) {
    console.error('daily-streak-job: failed to fetch profiles', profErr);
    return new Response(JSON.stringify({ error: profErr.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const results = { frozen: 0, broken: 0, skipped: 0 };

  for (const profile of (profiles ?? [])) {
    const tz = profile.timezone || 'UTC';

    // Compute local "yesterday" for this user's timezone using the UTC day boundary
    // We check whether they have ≥1 scored session during yesterday UTC as an
    // approximation; for full timezone fidelity the RPC handles display.
    const { count: practicedCount } = await supabase
      .from('practice_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'scored')
      .not('score', 'is', null)
      .gte('created_at', `${ydStr}T00:00:00Z`)
      .lt('created_at', `${ydStr}T24:00:00Z`);

    if ((practicedCount ?? 0) > 0) {
      results.skipped++;
      continue; // They practiced — no action needed
    }

    // Check if they had any streak to break (avoid inserting broken events for users
    // who never built a streak, by checking for any scored session ever).
    const { count: everPracticed } = await supabase
      .from('practice_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'scored')
      .not('score', 'is', null);

    if ((everPracticed ?? 0) === 0) {
      results.skipped++;
      continue; // Never practiced — nothing to protect
    }

    // Check for existing freeze event on this UTC day (idempotency)
    const { count: alreadyFrozen } = await supabase
      .from('streak_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('event_type', 'frozen')
      .gte('created_at', `${ydStr}T00:00:00Z`)
      .lt('created_at', `${ydStr}T24:00:00Z`);

    if ((alreadyFrozen ?? 0) > 0) {
      results.skipped++;
      continue; // Already handled
    }

    if ((profile.streak_freezes_available ?? 0) > 0) {
      // Auto-apply freeze — Gong pattern: silent, no confirmation needed
      const { error: freezeErr } = await supabase
        .from('user_profiles')
        .update({
          streak_freezes_available: profile.streak_freezes_available - 1,
          last_streak_freeze_used: ydStr,
        })
        .eq('id', profile.id);

      if (!freezeErr) {
        await supabase.from('streak_events').insert({
          user_id: profile.id,
          event_type: 'frozen',
          created_at: `${ydStr}T00:01:00Z`,
        });
        results.frozen++;
      }
    } else {
      // Streak broken — insert event so UI can surface it
      await supabase.from('streak_events').insert({
        user_id: profile.id,
        event_type: 'broken',
        created_at: `${ydStr}T00:01:00Z`,
      });
      results.broken++;
    }
  }

  console.log('daily-streak-job complete:', results);
  return new Response(JSON.stringify(results), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
