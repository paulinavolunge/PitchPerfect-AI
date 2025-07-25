import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error: insertError } = await supabaseClient
    .from("login_events")
    .insert({
      user_id: user.id,
      user_agent: req.headers.get("user-agent"),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

  if (insertError) {
    console.error("Insert error:", insertError);
    return new Response("Error logging login event", { status: 500 });
  }

  return new Response("Login event logged", { status: 200 });
});
