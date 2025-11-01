import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface FeedbackEmailRequest {
  email: string;
  sessionData?: Record<string, unknown>;
}

// HTML escape function to prevent XSS
const escapeHtml = (text: string): string => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Verify authentication
const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Authentication required');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid or missing authentication');
  
  return user;
};

const buildEmailHtml = (sessionData?: Record<string, unknown>) => {
  try {
    const feedback = (sessionData as any)?.feedback;
    const score = (sessionData as any)?.score;
    const strengths: string[] = (sessionData as any)?.strengths || [];
    const improvements: string[] = (sessionData as any)?.improvements || [];

    // Limit and escape all user content
    const escapedFeedback = feedback ? escapeHtml(String(feedback).substring(0, 2000)) : '';
    const escapedStrengths = strengths.slice(0, 10).map(s => escapeHtml(String(s).substring(0, 500)));
    const escapedImprovements = improvements.slice(0, 10).map(i => escapeHtml(String(i).substring(0, 500)));

    const strengthsHtml = escapedStrengths.length
      ? `<ul>${escapedStrengths.map((s) => `<li>${s}</li>`).join("")}</ul>`
      : "<p>-</p>";
    const improvementsHtml = escapedImprovements.length
      ? `<ul>${escapedImprovements.map((i) => `<li>${i}</li>`).join("")}</ul>`
      : "<p>-</p>";

    return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827;">
        <h1 style="margin:0 0 12px; font-size:20px;">Your PitchPerfect AI Feedback</h1>
        <p style="margin:0 0 16px; color:#374151;">Thanks for practicing your pitch! Here's your instant recap.</p>
        ${typeof score !== 'undefined' ? `<p style="margin:0 0 8px;"><strong>Score:</strong> ${Math.max(0, Math.min(10, Number(score) || 0))}/10</p>` : ''}
        ${escapedFeedback ? `<p style="margin:0 0 16px;"><strong>Overall Feedback:</strong> ${escapedFeedback}</p>` : ''}
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
    // Require authentication
    const user = await verifyAuth(req);
    
    const { email, sessionData }: FeedbackEmailRequest = await req.json();

    // Validate email belongs to authenticated user
    if (!email || typeof email !== "string" || email !== user.email) {
      return new Response(
        JSON.stringify({ error: "Email must match authenticated user" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders(origin!) } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
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

    console.log("[send-feedback-email] Email sent:", { 
      id: (result as any)?.data?.id || (result as any)?.id,
      userId: user.id 
    });

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
