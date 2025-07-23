import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  console.log("🚀 log-user-login function called");
  
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Check environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log("🔧 Environment check:");
    console.log("  SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
    console.log("  SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing environment variables");
      return new Response("Server configuration error", { status: 500 });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Extract and validate Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("🔑 Authorization header:", authHeader ? "✅ Present" : "❌ Missing");
    
    if (!authHeader) {
      console.error("❌ No Authorization header");
      return new Response("Missing Authorization header", { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🎫 Token extracted:");
    console.log("  Length:", token.length);
    console.log("  Starts with:", token.substring(0, 20) + "...");
    
    if (!token || token === authHeader) {
      console.error("❌ Invalid Authorization header format");
      return new Response("Invalid Authorization header format", { status: 401 });
    }

    // Test JWT parsing
    console.log("🔍 Testing JWT parsing...");
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    console.log("📊 JWT parsing result:");
    console.log("  Error:", error ? error.message : "None");
    console.log("  User:", user ? `✅ Valid (ID: ${user.id})` : "❌ No user");

    if (error) {
      console.error("❌ JWT parsing error:", error);
      return new Response(`JWT validation failed: ${error.message}`, { status: 401 });
    }

    if (!user) {
      console.error("❌ No user found from JWT");
      return new Response("Invalid or expired token", { status: 401 });
    }

    // Prepare data for insertion
    const loginData = {
      user_id: user.id,
      user_agent: req.headers.get("user-agent"),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    };

    console.log("💾 Attempting to insert login event:", {
      user_id: loginData.user_id,
      has_user_agent: !!loginData.user_agent,
      ip_address: loginData.ip_address
    });

    // Insert login event
    const { error: insertError } = await supabaseClient
      .from("login_events")
      .insert(loginData);

    if (insertError) {
      console.error("❌ Insert error:", insertError);
      return new Response(`Database error: ${insertError.message}`, { status: 500 });
    }

    console.log("✅ Login event logged successfully");
    return new Response("Login event logged", { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain',
      }
    });

  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return new Response(`Internal server error: ${err.message}`, { status: 500 });
  }
});
