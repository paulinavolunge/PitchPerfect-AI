import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICE_MAP: Record<string, string> = {
  solo: Deno.env.get("STRIPE_PRICE_SOLO") || "",
  team: Deno.env.get("STRIPE_PRICE_TEAM") || "",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { productType, quantity } = await req.json();

    if (!productType || !PRICE_MAP[productType]) {
      throw new Error(`Invalid product type: ${productType}`);
    }

    const priceId = PRICE_MAP[productType];
    if (!priceId) {
      throw new Error(
        `Stripe price not configured for ${productType}. Set STRIPE_PRICE_${productType.toUpperCase()} in Supabase secrets.`
      );
    }

    const seatCount = productType === "team" ? Math.max(3, quantity || 3) : 1;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("user_profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = req.headers.get("origin") || "https://pitchperfectai.ai";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: seatCount }],
      mode: "subscription",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: { supabase_user_id: user.id, product_type: productType, seats: String(seatCount) },
      subscription_data: {
        metadata: { supabase_user_id: user.id, product_type: productType, seats: String(seatCount) },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create checkout" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});