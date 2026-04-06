import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAN_CREDITS: Record<string, number> = {
  solo: 9999,
  team: 9999,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) throw new Error("Stripe configuration missing");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe signature");

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const productType = session.metadata?.product_type || "solo";
        if (userId) {
          const credits = PLAN_CREDITS[productType] || 9999;
          await supabase.from("user_profiles").update({
            is_premium: true,
            subscription_plan: productType,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            credits_remaining: credits,
            updated_at: new Date().toISOString(),
          }).eq("id", userId);
          console.log(`Activated ${productType} plan for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          const isActive = ["active", "trialing"].includes(subscription.status);
          await supabase.from("user_profiles").update({
            is_premium: isActive,
            updated_at: new Date().toISOString(),
          }).eq("id", userId);
          console.log(`Subscription ${subscription.status} for user ${userId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await supabase.from("user_profiles").update({
            is_premium: false,
            subscription_plan: "free",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq("id", userId);
          console.log(`Subscription cancelled for user ${userId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.supabase_user_id;
          const productType = sub.metadata?.product_type || "solo";
          if (userId) {
            const credits = PLAN_CREDITS[productType] || 9999;
            await supabase.from("user_profiles").update({
              credits_remaining: credits,
              updated_at: new Date().toISOString(),
            }).eq("id", userId);
            console.log(`Refreshed ${credits} credits for user ${userId}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`Payment failed for invoice ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});