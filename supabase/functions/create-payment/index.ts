
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

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get product type from request
    const { productType } = await req.json();

    // Define subscription products with new price IDs
    const subscriptionProducts = {
      basic: {
        name: "PitchPerfect AI - Basic Practice Pack",
        priceId: "price_1RY7IeRv5Z8vxUAiVn18tSaO",
        amount: 2900, // $29.00
        credits: 50,
        interval: "month"
      },
      pro: {
        name: "PitchPerfect AI - Professional Pack", 
        priceId: "price_1RY7J9Rv5Z8vxUAimaSyVGQg",
        amount: 7900, // $79.00
        credits: 200,
        interval: "month"
      },
      enterprise: {
        name: "PitchPerfect AI - Enterprise Pack",
        priceId: "price_1RY7JQRv5Z8vxUAiXFltiMqU",
        amount: 19900, // $199.00
        credits: -1, // unlimited
        interval: "month"
      }
    };

    // Define one-time credit pack products with new price IDs
    const creditPackProducts = {
      "credits-20": {
        name: "20 Credits Pack",
        priceId: "price_1RY7RFRv5Z8vxUAi8Iss2Ixa",
        amount: 499, // $4.99
        credits: 20
      },
      "credits-100": {
        name: "100 Credits Pack",
        priceId: "price_1RY7SeRv5Z8vxUAiUTh8whM1",
        amount: 1499, // $14.99
        credits: 100
      },
      "credits-500": {
        name: "500 Credits Pack",
        priceId: "price_1RY7U9Rv5Z8vxUAi339QAKFu",
        amount: 4999, // $49.99
        credits: 500
      }
    };

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    let session;

    // Handle subscription products
    if (subscriptionProducts[productType as keyof typeof subscriptionProducts]) {
      const selectedProduct = subscriptionProducts[productType as keyof typeof subscriptionProducts];
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: selectedProduct.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/pricing`,
        metadata: {
          user_id: user.id,
          product_type: productType,
          credits: selectedProduct.credits.toString(),
          type: "subscription"
        }
      });
    }
    // Handle one-time credit pack products
    else if (creditPackProducts[productType as keyof typeof creditPackProducts]) {
      const selectedProduct = creditPackProducts[productType as keyof typeof creditPackProducts];
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: selectedProduct.priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/pricing`,
        metadata: {
          user_id: user.id,
          product_type: productType,
          credits: selectedProduct.credits.toString(),
          type: "credit_pack"
        }
      });
    } else {
      throw new Error("Invalid product type");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
