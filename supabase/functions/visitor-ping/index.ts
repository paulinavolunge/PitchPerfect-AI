import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const WINDOW_MINUTES = 5;
const MAX_VISITOR_ID_LEN = 64;
const MAX_PATH_LEN = 200;

serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin") ?? undefined);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (req.method === "POST") {
      let body: { visitor_id?: unknown; path?: unknown } = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const visitorId =
        typeof body.visitor_id === "string" && body.visitor_id.length > 0
          ? body.visitor_id.slice(0, MAX_VISITOR_ID_LEN)
          : crypto.randomUUID();
      const path =
        typeof body.path === "string" ? body.path.slice(0, MAX_PATH_LEN) : null;

      await supabase.from("visitor_pings").insert({ visitor_id: visitorId, path });

      // Housekeeping: drop pings older than a day (cheap, keeps table tiny)
      await supabase
        .from("visitor_pings")
        .delete()
        .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    } else if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("visitor_pings")
      .select("visitor_id")
      .gte("created_at", since)
      .limit(1000);

    if (error) throw error;

    const live = new Set((data ?? []).map((r) => r.visitor_id)).size;

    return new Response(JSON.stringify({ live, window_minutes: WINDOW_MINUTES }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[INTERNAL] visitor-ping error:", err);
    return new Response(JSON.stringify({ error: "counter_unavailable" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
