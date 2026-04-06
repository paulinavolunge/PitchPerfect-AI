import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload?.record;
    
    if (!record?.email) {
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = record.email;
    const fullName = record.raw_user_meta_data?.full_name || record.raw_user_meta_data?.name || "";
    const firstName = fullName.split(" ")[0] || "there";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a2e; margin: 0;">PitchPerfect AI</h1>
        </div>
        <h2 style="color: #1a1a2e;">Hey ${firstName}!</h2>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          You just took the first step toward never freezing on a sales call again.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.pitchperfectai.ai/practice" 
             style="display: inline-block; padding: 14px 32px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Start Practicing →
          </a>
        </div>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="font-size: 14px; color: #555; margin: 8px 0;">✓ AI-powered feedback after every session</p>
          <p style="font-size: 14px; color: #555; margin: 8px 0;">✓ Realistic buyer roleplays that push back</p>
          <p style="font-size: 14px; color: #555; margin: 8px 0;">✓ Track your improvement over time</p>
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          <strong>You have 3 free practice sessions this month.</strong> Make them count.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          PitchPerfect AI — Your AI Sales Sparring Partner
        </p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "PitchPerfect AI <info@pitchperfectai.ai>",
        to: [email],
        subject: "Welcome to PitchPerfect AI — Your 3 Free Sessions Are Ready",
        html: html,
      }),
    });

    const result = await resendRes.json();
    console.log("Resend response:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: resendRes.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
