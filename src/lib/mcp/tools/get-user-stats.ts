import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_user_stats",
  title: "Get user practice stats",
  description:
    "Summarize the signed-in user's PitchPerfect AI practice performance: total sessions, average score, best score, and last session date.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input: z.infer<z.ZodObject<{}>>, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("practice_sessions")
      .select("score, created_at, status")
      .eq("user_id", ctx.getUserId());
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = data ?? [];
    const scored = rows.filter((r) => typeof r.score === "number");
    const scores = scored.map((r) => r.score as number);
    const stats = {
      total_sessions: rows.length,
      scored_sessions: scored.length,
      average_score: scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null,
      best_score: scores.length ? Math.max(...scores) : null,
      last_session_at: rows
        .map((r) => r.created_at)
        .sort()
        .reverse()[0] ?? null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      structuredContent: { stats },
    };
  },
});
