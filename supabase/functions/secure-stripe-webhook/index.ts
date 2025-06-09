
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Enhanced security utilities
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[<>'"&]/g, '').trim().substring(0, 255);
};

const getSecurityHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
});

const logSecurityEvent = async (supabase: any, eventType: string, details: any) => {
  try {
    await supabase.rpc('log_security_event', {
      p_event_type: eventType,
      p_event_details: details
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
      .replace(/password|secret|key|token/gi, '[REDACTED]')
      .replace(/\b\d{4,}\b/g, '[NUMBER]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  }
  return 'An unexpected error occurred';
};

// Credit mappings for the new price IDs
const PLAN_CREDITS: { [priceId: string]: number } = {
  "price_1RY7IeRv5Z8vxUAiVn18tSaO": 50,   // Basic - $29/month
  "price_1RY7J9Rv5Z8vxUAimaSyVGQg": 200,  // Professional - $79/month  
  "price_1RY7JQRv5Z8vxUAiXFltiMqU": -1,   // Enterprise - $199/month (unlimited)
  "price_1RY7RFRv5Z8vxUAi8Iss2Ixa": 20,   // 20 credits - $4.99
  "price_1RY7SeRv5Z8vxUAiUTh8whM1": 100,  // 100 credits - $14.99
  "price_1RY7U9Rv5Z8vxUAi339QAKFu": 500,  // 500 credits - $49.99
};

const PLAN_NAMES: { [priceId: string]: string } = {
  "price_1RY7IeRv5Z8vxUAiVn18tSaO": "Basic Practice Pack",
  "price_1RY7J9Rv5Z8vxUAimaSyVGQg": "Professional Pack",
  "price_1RY7JQRv5Z8vxUAiXFltiMqU": "Enterprise Pack",
  "price_1RY7RFRv5Z8vxUAi8Iss2Ixa": "20 Credits Pack",
  "price_1RY7SeRv5Z8vxUAiUTh8whM1": "100 Credits Pack", 
  "price_1RY7U9Rv5Z8vxUAi339QAKFu": "500 Credits Pack",
};

serve(async (req) => {
  const securityHeaders = getSecurityHeaders();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: securityHeaders });
  }

  try {
    // Enhanced request validation
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature provided", { 
        status: 400, 
        headers: securityHeaders 
      });
    }

    const body = await req.text();
    if (!body || body.length === 0) {
      return new Response("Empty request body", { 
        status: 400, 
        headers: securityHeaders 
      });
    }

    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return new Response("Invalid content type", { 
        status: 400, 
        headers: securityHeaders 
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    if (!stripeKey || !webhookSecret) {
      return new Response("Configuration error", { 
        status: 500, 
        headers: securityHeaders 
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      await logSecurityEvent(supabaseAdmin, 'webhook_signature_failed', {
        error: sanitizeErrorMessage(err),
        content_length: body.length
      });
      
      return new Response(`Webhook Error: ${sanitizeErrorMessage(err)}`, { 
        status: 400, 
        headers: securityHeaders 
      });
    }

    // Log successful webhook receipt
    await logSecurityEvent(supabaseAdmin, 'webhook_received', {
      event_type: event.type,
      event_id: event.id
    });

    // Handle the event with enhanced validation
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = sanitizeInput(session.metadata?.user_id || '');
        const productType = sanitizeInput(session.metadata?.product_type || '');
        const type = sanitizeInput(session.metadata?.type || '');

        if (!userId || !type) {
          await logSecurityEvent(supabaseAdmin, 'webhook_invalid_metadata', {
            event_type: event.type,
            has_user_id: !!userId,
            has_type: !!type
          });
          
          return new Response('Invalid metadata', { 
            status: 400, 
            headers: securityHeaders 
          });
        }

        // Process subscription or credit pack with enhanced logging
        if (type === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0].price.id;
          const planName = PLAN_NAMES[priceId] || 'Unknown Plan';
          const creditsToGrant = PLAN_CREDITS[priceId] || 0;

          await logSecurityEvent(supabaseAdmin, 'subscription_processed', {
            user_id: userId,
            plan_name: planName,
            credits_granted: creditsToGrant
          });

          // ... rest of subscription processing logic
        } else if (type === 'credit_pack') {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0].price?.id;
          const creditsToGrant = PLAN_CREDITS[priceId || ''] || 0;

          await logSecurityEvent(supabaseAdmin, 'credit_pack_processed', {
            user_id: userId,
            credits_granted: creditsToGrant,
            price_id: priceId
          });

          // ... rest of credit pack processing logic
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...securityHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const errorMessage = sanitizeErrorMessage(err);
    console.error('Webhook processing error:', err);
    
    return new Response(`Internal Server Error: ${errorMessage}`, { 
      status: 500, 
      headers: securityHeaders 
    });
  }
});
