
// stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// This function handles Stripe webhook events
serve(async (req) => {
  try {
    // Get the stripe signature from the request headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature provided", { status: 400 });
    }

    const body = await req.text();
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Initialize Supabase with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata?.user_id;
        const email = session.metadata?.email;
        
        if (!userId || !email) {
          console.log('No user data found in session metadata');
          return new Response('No user data found', { status: 400 });
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Get plan details
        const planId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(planId);
        const planName = price.nickname || (price.recurring?.interval === 'month' ? 'Monthly' : 'Yearly');
        
        // Update the subscribers table
        const { error } = await supabaseAdmin.from('subscribers').upsert({
          user_id: userId,
          email: email,
          stripe_customer_id: customerId,
          subscribed: true,
          subscription_tier: planName,
          subscription_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
        
        if (error) {
          console.error('Error updating subscriber:', error);
          return new Response(`Error updating subscriber: ${error.message}`, { status: 500 });
        }
        
        console.log(`Successfully processed subscription for user ${userId}`);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get customer data
        const customer = await stripe.customers.retrieve(customerId.toString());
        if (!customer || customer.deleted) {
          return new Response('Customer not found or deleted', { status: 400 });
        }
        
        const email = customer.email;
        if (!email) {
          return new Response('No email found for customer', { status: 400 });
        }

        // Get subscriber from Supabase
        const { data: subscribers, error: fetchError } = await supabaseAdmin
          .from('subscribers')
          .select('*')
          .eq('email', email)
          .limit(1);
        
        if (fetchError || subscribers.length === 0) {
          console.error('Error fetching subscriber:', fetchError);
          return new Response(`Error fetching subscriber: ${fetchError?.message || 'Not found'}`, { status: 500 });
        }
        
        const userId = subscribers[0].user_id;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const status = subscription.status === 'active' || subscription.status === 'trialing';
        
        // Get plan details
        const planId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(planId);
        const planName = price.nickname || (price.recurring?.interval === 'month' ? 'Monthly' : 'Yearly');
        
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
          console.error('Error updating subscriber:', updateError);
          return new Response(`Error updating subscriber: ${updateError.message}`, { status: 500 });
        }
        
        console.log(`Successfully updated subscription for user ${userId}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get customer data
        const customer = await stripe.customers.retrieve(customerId.toString());
        if (!customer || customer.deleted) {
          return new Response('Customer not found or deleted', { status: 400 });
        }
        
        const email = customer.email;
        if (!email) {
          return new Response('No email found for customer', { status: 400 });
        }

        // Update subscription in Supabase to indicate it's no longer active
        const { error } = await supabaseAdmin.from('subscribers').update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString()
        }).eq('email', email);
        
        if (error) {
          console.error('Error updating subscriber:', error);
          return new Response(`Error updating subscriber: ${error.message}`, { status: 500 });
        }
        
        console.log(`Successfully marked subscription as inactive for customer ${customerId}`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
});
