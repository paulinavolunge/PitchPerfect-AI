// Public edge function used by the /scorecard-unlock landing page after a
// Stripe Payment Link redirects buyers back to the app. Given a Stripe
// checkout `session_id`, returns whether the session is paid plus the
// buyer email and a short summary of what they bought. No JWT required —
// the page is hit by anonymous visitors directly from a Stripe redirect.
//
// We use Stripe's signed session id as the auth proof: only Stripe could
// have generated it, and we never trust the page to tell us what was paid.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyResponse {
  paid: boolean;
  email: string | null;
  mode: "payment" | "subscription" | "setup" | null;
  amountTotal: number | null;
  productLabel: string | null;
}

function packLabelFromAmount(amount: number | null, mode: string | null): string | null {
  if (mode === "subscription") return "Unlimited Pro";
  if (amount === 499) return "Starter Pack — 5 rounds";
  if (amount === 999) return "Power Pack — 15 rounds";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe configuration missing");

    const { session_id } = await req.json().catch(() => ({}));
    if (!session_id || typeof session_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === "paid" || session.status === "complete";
    const email =
      session.customer_details?.email ?? session.customer_email ?? null;

    const body: VerifyResponse = {
      paid,
      email,
      mode: (session.mode as VerifyResponse["mode"]) ?? null,
      amountTotal: session.amount_total ?? null,
      productLabel: packLabelFromAmount(session.amount_total ?? null, session.mode ?? null),
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("verify-stripe-session error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Verification failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
