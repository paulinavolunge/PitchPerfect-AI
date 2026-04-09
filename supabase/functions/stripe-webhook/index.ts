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

// One-time credit packs sold via Stripe Payment Links.
//
// We detect the pack from `session.amount_total` (in cents) because Stripe
// Payment Links don't carry the user's supabase_user_id in metadata — the
// buyer isn't signed in when they click the link from the ScorePaywall.
//
// If you ever change prices, update these amounts.
const CREDIT_PACK_BY_AMOUNT: Record<number, { credits: number; name: string }> = {
  499: { credits: 5, name: "starter" },   // $4.99 → 5 rounds
  999: { credits: 15, name: "power" },    // $9.99 → 15 rounds
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

        // ───── Subscription flow ($29/mo Unlimited Pro) ─────
        // Unchanged from the existing implementation. Subscriptions are
        // created by an authenticated user via the app and carry
        // supabase_user_id in metadata.
        if (session.mode === "subscription") {
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
          } else {
            console.warn(`Subscription session ${session.id} missing supabase_user_id metadata`);
          }
          break;
        }

        // ───── One-time credit pack flow ($4.99 starter / $9.99 power) ─────
        if (session.mode === "payment") {
          const amount = session.amount_total ?? 0;
          const pack = CREDIT_PACK_BY_AMOUNT[amount];
          if (!pack) {
            console.warn(
              `Unknown one-time payment amount ${amount} cents on session ${session.id}; ignoring.`,
            );
            break;
          }

          const email =
            session.customer_details?.email ?? session.customer_email ?? null;
          if (!email) {
            console.error(
              `No buyer email on session ${session.id}; cannot grant ${pack.credits} ${pack.name} credits.`,
            );
            break;
          }

          // Idempotency: insert into pending_credits first. The UNIQUE constraint
          // on stripe_session_id guarantees we process each Stripe session exactly
          // once, even if Stripe retries the webhook.
          const { error: insertErr } = await supabase
            .from("pending_credits")
            .insert({
              email,
              credits: pack.credits,
              stripe_session_id: session.id,
            });

          if (insertErr) {
            // 23505 = unique violation → we've already processed this session
            if ((insertErr as any).code === "23505") {
              console.log(`Session ${session.id} already processed — skipping.`);
              break;
            }
            console.error(`Failed to record pending credits:`, insertErr);
            throw insertErr;
          }

          // Try to resolve the buyer to an existing auth user
          const { data: resolvedId, error: lookupErr } = await supabase.rpc(
            "get_user_id_by_email",
            { p_email: email },
          );
          if (lookupErr) {
            console.error(`Email lookup failed for ${email}:`, lookupErr);
          }

          const existingUserId = (resolvedId as string | null) ?? null;

          if (existingUserId) {
            // Read current balance and grant credits
            const { data: profile, error: profileErr } = await supabase
              .from("user_profiles")
              .select("credits_remaining")
              .eq("id", existingUserId)
              .single();

            if (profileErr) {
              console.error(
                `Could not read profile for ${existingUserId}; leaving credits in pending_credits for later:`,
                profileErr,
              );
              break;
            }

            const newBalance = (profile?.credits_remaining ?? 0) + pack.credits;

            const { error: updateErr } = await supabase
              .from("user_profiles")
              .update({
                credits_remaining: newBalance,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingUserId);

            if (updateErr) {
              console.error(
                `Failed to grant ${pack.credits} credits to ${existingUserId}:`,
                updateErr,
              );
              break;
            }

            // Mark the pending row as consumed so the signup trigger doesn't grant it again
            await supabase
              .from("pending_credits")
              .update({
                consumed_at: new Date().toISOString(),
                consumed_user_id: existingUserId,
              })
              .eq("stripe_session_id", session.id);

            console.log(
              `Granted ${pack.credits} ${pack.name} credits to user ${existingUserId} (new balance: ${newBalance}).`,
            );
          } else {
            console.log(
              `No user yet for ${email}; holding ${pack.credits} ${pack.name} credits in pending_credits for signup.`,
            );
          }
          break;
        }

        console.log(`checkout.session.completed for mode "${session.mode}" — no handler`);
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
