import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response("Unauthorized: No token provided", { status: 401 });
    }

    // Create Supabase client with the user's JWT token in the global headers
    // This ensures the client operates in the context of the authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    );

    // Get user from the token
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (error) {
      console.error("Auth error:", error);
      return new Response(`Unauthorized: ${error.message}`, { status: 401 });
    }

    if (!user) {
      console.error("No user found for JWT token");
      return new Response("Unauthorized: No user found for JWT", { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Insert login event
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
  } catch (error) {
    console.error("Function error:", error);
    return new Response(`Internal server error: ${error.message}`, { status: 500 });
  }
});
