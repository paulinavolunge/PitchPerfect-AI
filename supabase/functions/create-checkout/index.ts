
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) throw new Error("Missing auth token");

    const { data } = await supabase.auth.getUser(token);
    const user = data?.user;
    if (!user?.email) throw new Error("Unauthorized");

    const body = await req.json();
    const { priceId, successUrl, cancelUrl } = body;
    if (!priceId) throw new Error("Missing priceId");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    // Retrieve the user's profile to check if they have used their free trial
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('trial_used')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile in create-checkout:", profileError);
      // Continue, but without trial period if profile isn't accessible
    }

    let trialPeriodDays: number | undefined = undefined;
    
    // Define subscription price IDs
    const subscriptionPrices = [
      "price_1RY7IeRv5Z8vxUAiVn18tSaO", // Basic
      "price_1RY7J9Rv5Z8vxUAimaSyVGQg", // Professional  
      "price_1RY7JQRv5Z8vxUAiXFltiMqU"  // Enterprise
    ];
    
    // Only apply trial for subscription plans if user hasn't used their trial
    if (userProfile && !userProfile.trial_used && subscriptionPrices.includes(priceId)) {
        trialPeriodDays = 7; // Offer 7 days trial on first subscription attempt if not used
    }

    const customerList = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customerList.data[0]?.id || (await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id }
    })).id;

    // Determine session mode based on price ID
    const isSubscription = subscriptionPrices.includes(priceId);
    const mode = isSubscription ? "subscription" : "payment";

    const sessionData: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode,
      success_url: successUrl || `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        email: user.email,
        type: isSubscription ? 'subscription' : 'credit_pack'
      }
    };

    // Add trial period for subscriptions if applicable
    if (trialPeriodDays !== undefined && isSubscription) {
      sessionData.subscription_data = { trial_period_days: trialPeriodDays };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
