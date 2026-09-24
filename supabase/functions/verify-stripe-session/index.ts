// Public edge function used by the /scorecard-unlock landing page after a
// Stripe Payment Link redirects buyers back to the app. Given a Stripe
// checkout `session_id`, returns whether the session is paid plus
// a short non-identifying summary of what they bought. No JWT required —
// the page is hit by anonymous visitors directly from a Stripe redirect.
//
// A checkout ID is a bearer lookup reference, not proof of customer identity.
// Never return customer identifiers from this public endpoint.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

import { createVerifyStripeSessionHandler } from "../_shared/verifyStripeSession.ts";

serve(createVerifyStripeSessionHandler(async (sessionId) => {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe configuration missing");
  const stripe = new Stripe(key, {
    apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient(),
  });
  return await stripe.checkout.sessions.retrieve(sessionId);
}));
