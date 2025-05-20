
// create-checkout/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started");

  // Create a Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the request body
    let reqBody;
    try {
      reqBody = await req.json();
    } catch (e) {
      reqBody = {};
    }

    const priceType = reqBody.price || "monthly";
    const successUrl = reqBody.successUrl || `${req.headers.get("origin")}/subscription?success=true`;
    const cancelUrl = reqBody.cancelUrl || `${req.headers.get("origin")}/subscription?canceled=true`;

    logStep("Request parameters", { priceType, successUrl, cancelUrl });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Using existing customer", { customerId });
    } else {
      // Create a new customer
      const newCustomer = await stripe.customers.create({ email: user.email });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // Get price IDs from environment variables
    const MONTHLY_PRICE_ID = Deno.env.get("STRIPE_MONTHLY_PRICE_ID");
    const YEARLY_PRICE_ID = Deno.env.get("STRIPE_YEARLY_PRICE_ID");
    
    if (!MONTHLY_PRICE_ID || !YEARLY_PRICE_ID) {
      throw new Error("Missing required Stripe price IDs in environment variables");
    }
    
    logStep("Retrieved price IDs", { 
      monthly: MONTHLY_PRICE_ID.substring(0, 5) + "...", 
      yearly: YEARLY_PRICE_ID.substring(0, 5) + "..." 
    });

    const priceId = priceType === "yearly" ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Add metadata to track the subscription
      metadata: {
        user_id: user.id,
        email: user.email,
        plan: priceType
      }
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
