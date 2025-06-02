
// stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Input sanitization function
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  // Remove potentially dangerous characters and limit length
  return input.replace(/[<>'"&]/g, '').trim().substring(0, 255);
};

// Credit mappings for plans (adjust these based on your Stripe Price IDs and desired credits)
const PLAN_CREDITS: { [priceId: string]: number } = {
  // Replace with your actual Stripe Price IDs and corresponding credits
  [Deno.env.get("STRIPE_STARTER_PRICE_ID") || "price_starter_monthly"]: 30,
  [Deno.env.get("STRIPE_PROFESSIONAL_PRICE_ID") || "price_professional_monthly"]: 100,
  // Add yearly plan IDs if applicable
  [Deno.env.get("VITE_STRIPE_STARTER_PRICE_ID") || "price_starter_monthly_vite"]: 30, // For local dev
  [Deno.env.get("VITE_STRIPE_PROFESSIONAL_PRICE_ID") || "price_professional_monthly_vite"]: 100, // For local dev
};

// This function handles Stripe webhook events
serve(async (req) => {
  try {
    logStep("Function started");

    // Get the stripe signature from the request headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR", { message: "No signature provided" });
      return new Response("No signature provided", { status: 400 });
    }

    const body = await req.text();
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    if (!webhookSecret) {
      logStep("WARNING", { message: "STRIPE_WEBHOOK_SECRET not set, webhook signature validation will be skipped" });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Verify the event
    let event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Event signature verified", { type: event.type });
      } else {
        // If no webhook secret, parse the event without verification (not recommended for production)
        event = JSON.parse(body);
        logStep("Event parsed without verification", { type: event.type });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("ERROR verifying webhook", { message: errorMessage });
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    // Initialize Supabase with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    logStep(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = sanitizeInput(session.metadata?.user_id || '');
        const email = sanitizeInput(session.metadata?.email || '');

        if (!userId || !email) {
          logStep('ERROR', { message: 'No user data found in session metadata' });
          return new Response('No user data found', { status: 400 });
        }

        logStep('Checkout session completed', { customerId, userId, email });

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        // Get plan details
        const planId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(planId);
        const planName = sanitizeInput(price.nickname || (price.recurring?.interval === 'month' ? 'Monthly' : 'Yearly'));
        const creditsToGrant = PLAN_CREDITS[planId] || 0; // Get credits from mapping

        logStep('Subscription details retrieved', { 
          subscriptionId: subscription.id, 
          planName, 
          currentPeriodEnd,
          creditsToGrant
        });

        // Update the subscribers table
        const { error: subError } = await supabaseAdmin.from('subscribers').upsert({
          user_id: userId,
          email: email,
          stripe_customer_id: customerId,
          subscribed: true,
          subscription_tier: planName,
          subscription_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

        if (subError) {
          logStep('ERROR updating subscriber', { message: subError.message });
          return new Response(`Error updating subscriber: ${subError.message}`, { status: 500 });
        }

        // Update user_profiles to add credits using the secure function
        const { data: creditResult, error: creditError } = await supabaseAdmin.rpc('secure_deduct_credits_and_log_usage', {
          p_user_id: userId,
          p_feature_used: `subscription_${planName.toLowerCase()}`,
          p_credits_to_deduct: -creditsToGrant // Negative to add credits
        });

        if (creditError) {
          logStep('ERROR updating user credits', { message: creditError.message });
          return new Response(`Error updating user credits: ${creditError.message}`, { status: 500 });
        }

        logStep(`Successfully processed subscription and granted ${creditsToGrant} credits for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        logStep('Subscription updated', { subscriptionId: subscription.id, customerId });

        // Get customer data
        const customer = await stripe.customers.retrieve(customerId.toString());
        if (!customer || customer.deleted) {
          logStep('ERROR', { message: 'Customer not found or deleted' });
          return new Response('Customer not found or deleted', { status: 400 });
        }

        const email = sanitizeInput(customer.email || '');
        if (!email) {
          logStep('ERROR', { message: 'No email found for customer' });
          return new Response('No email found for customer', { status: 400 });
        }

        // Get subscriber from Supabase
        const { data: subscribers, error: fetchError } = await supabaseAdmin
          .from('subscribers')
          .select('user_id')
          .eq('email', email)
          .limit(1);

        if (fetchError || subscribers.length === 0) {
          logStep('ERROR fetching subscriber user_id', { message: fetchError?.message || 'Not found' });
          return new Response(`Error fetching subscriber user_id: ${fetchError?.message || 'Not found'}`, { status: 500 });
        }

        const userId = subscribers[0].user_id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const status = subscription.status === 'active' || subscription.status === 'trialing';

        // Get plan details
        const planId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(planId);
        const planName = sanitizeInput(price.nickname || (price.recurring?.interval === 'month' ? 'Monthly' : 'Yearly'));
        const creditsToGrant = PLAN_CREDITS[planId] || 0;

        logStep('Updating subscription in database', { 
          userId, 
          email, 
          status, 
          planName, 
          currentPeriodEnd,
          creditsToGrant
        });

        // Update subscription in Supabase
        const { error: updateError } = await supabaseAdmin.from('subscribers').upsert({
          user_id: userId,
          email: email,
          stripe_customer_id: customerId,
          subscribed: status,
          subscription_tier: planName,
          subscription_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

        if (updateError) {
          logStep('ERROR updating subscriber', { message: updateError.message });
          return new Response(`Error updating subscriber: ${updateError.message}`, { status: 500 });
        }

        // If subscription is active, top up credits using secure function
        if (status) {
          const { error: creditError } = await supabaseAdmin.rpc('secure_deduct_credits_and_log_usage', {
            p_user_id: userId,
            p_feature_used: `subscription_renewal_${planName.toLowerCase()}`,
            p_credits_to_deduct: -creditsToGrant // Negative to add credits
          });

          if (creditError) {
            logStep('ERROR topping up credits', { message: creditError.message });
            return new Response(`Error topping up credits: ${creditError.message}`, { status: 500 });
          }
          logStep(`Successfully topped up ${creditsToGrant} credits for user ${userId}`);
        }

        logStep(`Successfully updated subscription for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        logStep('Subscription deleted', { subscriptionId: subscription.id, customerId });

        // Get customer data
        const customer = await stripe.customers.retrieve(customerId.toString());
        if (!customer || customer.deleted) {
          logStep('ERROR', { message: 'Customer not found or deleted' });
          return new Response('Customer not found or deleted', { status: 400 });
        }

        const email = sanitizeInput(customer.email || '');
        if (!email) {
          logStep('ERROR', { message: 'No email found for customer' });
          return new Response('No email found for customer', { status: 400 });
        }

        logStep('Marking subscription as inactive', { email });

        // Update subscription in Supabase to indicate it's no longer active
        const { error } = await supabaseAdmin.from('subscribers').update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString()
        }).eq('email', email);

        if (error) {
          logStep('ERROR updating subscriber', { message: error.message });
          return new Response(`Error updating subscriber: ${error.message}`, { status: 500 });
        }

        logStep(`Successfully marked subscription as inactive for customer ${customerId}`);
        break;
      }

      default:
        logStep(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logStep(`ERROR processing webhook`, { message: errorMessage });
    return new Response(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
});
