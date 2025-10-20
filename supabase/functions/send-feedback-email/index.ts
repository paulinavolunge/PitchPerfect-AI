import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface FeedbackEmailRequest {
  email: string;
  sessionData?: Record<string, unknown>;
}

const buildEmailHtml = (sessionData?: Record<string, unknown>) => {
  try {
    const feedback = (sessionData as any)?.feedback;
    const score = (sessionData as any)?.score;
    const strengths: string[] = (sessionData as any)?.strengths || [];
    const improvements: string[] = (sessionData as any)?.improvements || [];

    const strengthsHtml = strengths.length
      ? `<ul>${strengths.map((s) => `<li>${String(s)}</li>`).join("")}</ul>`
      : "<p>-</p>";
    const improvementsHtml = improvements.length
      ? `<ul>${improvements.map((i) => `<li>${String(i)}</li>`).join("")}</ul>`
      : "<p>-</p>";

    return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827;">
        <h1 style="margin:0 0 12px; font-size:20px;">Your PitchPerfect AI Feedback</h1>
        <p style="margin:0 0 16px; color:#374151;">Thanks for practicing your pitch! Here's your instant recap.</p>
        ${typeof score !== 'undefined' ? `<p style="margin:0 0 8px;"><strong>Score:</strong> ${score}/10</p>` : ''}
        ${feedback ? `<p style="margin:0 0 16px;"><strong>Overall Feedback:</strong> ${String(feedback)}</p>` : ''}
        <h2 style="margin:16px 0 8px; font-size:16px;">What you did well</h2>
        ${strengthsHtml}
        <h2 style="margin:16px 0 8px; font-size:16px;">Opportunities to improve</h2>
        ${improvementsHtml}
        <p style="margin:16px 0 0; color:#6B7280; font-size:12px;">You can continue practicing in the app to improve your score. Keep going!</p>
      </div>
    `;
  } catch (_) {
    return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827;">
        <h1 style="margin:0 0 12px; font-size:20px;">Your PitchPerfect AI Feedback</h1>
        <p style="margin:0 0 16px; color:#374151;">Thanks for practicing your pitch! Your recap is attached.</p>
      </div>
    `;
  }
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin!) });
  }

  try {
    const { email, sessionData }: FeedbackEmailRequest = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin!) } }
      );
    }

    const subject = "Your PitchPerfect AI feedback";
    const html = buildEmailHtml(sessionData);

    const result = await resend.emails.send({
      from: "PitchPerfect <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("[send-feedback-email] Email sent:", { id: (result as any)?.data?.id || (result as any)?.id });

    return new Response(
      JSON.stringify({ success: true, id: (result as any)?.data?.id || (result as any)?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(origin!) } }
    );
  } catch (error: any) {
    console.error("[send-feedback-email] Error:", error?.message || error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(origin!) } }
    );
  }
});
