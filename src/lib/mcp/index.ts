import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPracticeSessions from "./tools/list-practice-sessions";
import getPracticeSession from "./tools/get-practice-session";
import getUserStats from "./tools/get-user-stats";

// Issuer MUST be the direct supabase.co host, not the .lovable.cloud proxy.
// Built from the project ref, inlined by Vite at build time.
const projectRef =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ?? "project-ref-unset";

export default defineMcp({
  name: "pitchperfect-ai-mcp",
  title: "PitchPerfect AI",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in PitchPerfect AI user. Use `list_practice_sessions` to see recent roleplay rounds, `get_practice_session` for the transcript and AI feedback of one round, and `get_user_stats` for an overall performance summary.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPracticeSessions, getPracticeSession, getUserStats],
});
