import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Missing authorization token');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');

  return user;
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin!) });
  }
  
  try {
    // Verify authentication using the centralized function
    const user = await verifyAuth(req);
    console.log('Authenticated user:', user.id);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { error: insertError } = await supabaseClient
      .from("login_events")
      .insert({
        user_id: user.id,
        user_agent: req.headers.get("user-agent"),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response("Error logging login event", { 
        status: 500, 
        headers: corsHeaders(origin!) 
      });
    }

    return new Response("Login event logged", { 
      status: 200, 
      headers: corsHeaders(origin!) 
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response("Unauthorized", { 
      status: 401, 
      headers: corsHeaders(origin!) 
    });
  }
});
