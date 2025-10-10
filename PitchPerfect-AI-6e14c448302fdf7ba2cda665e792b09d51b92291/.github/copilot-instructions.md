Copilot Instructions for AI Coding Agents — PitchPerfectAI.ai
Project Overview

PitchPerfect AI is a real-time sales training and objection-handling app built with React (Vite), TypeScript, TailwindCSS, and Supabase (Auth, DB, Edge Functions). Optional providers: OpenAI, Claude, ElevenLabs.
Goal: roleplay sales calls (text/voice), generate feedback, track progress, and ship fast with clean, testable modules.

Architectural Patterns

Factory – Create/register AI agents (Chat, Objection, Feedback, Voice).

Strategy – Pluggable model/providers per feature (OpenAI/Claude/Gemini).

Adapter – Wrap SDKs (Supabase, OpenAI, ElevenLabs) behind interfaces.

Builder – Prompt/payload builders for consistent requests.

Dependency Inversion – Depend on interfaces; mock in tests.

Directory Map (authoritative)
src/
  components/            # UI (Chat, Recorder, Feedback, Decks)
  pages/                 # Routes (Home, Practice, Scenarios, Settings)
  hooks/                 # useAuth, useRealtime, useAudio, etc.
  contexts/              # User/Session/Theme (light-only)
  lib/
    ai/
      agents/            # ObjectionAgent, FeedbackAgent, ScenarioAgent, VoiceAgent
      strategies/        # model selection, scoring, tone rules
      builder/           # promptBuilder.ts, payloadBuilder.ts
      adapters/          # openai.ts, claude.ts, elevenlabs.ts
    supabase/            # client, edge helpers, rls utils
  utils/                  # validation, formatters, audioCache
  constants/              # TEXT.ts, ROUTES.ts, MODELS.ts
supabase/functions/       # server logic (proxy, scoring, secure ops)

Dev Conventions

Light mode only (disable dark mode toggles).

Components: PascalCase; utils: camelCase; constants: UPPER_SNAKE_CASE.

Max nesting: 3 levels per component; lift state up or use context.

Env: never hardcode keys. Use import.meta.env.VITE_* (client) and secrets in Edge Functions (server).

Errors: throw typed errors; surface user-safe messages; log to Supabase.

Commits: Conventional Commits (feat:, fix:, chore:, etc.).

Tasks for AI Agents (how to help)

Add a new AI agent

Create src/lib/ai/agents/<Name>Agent.ts implementing BaseAgent.

Register in src/lib/ai/agents/agentRegistry.ts.

Provide defaults in src/constants/MODELS.ts.

Create a new scenario type

Add JSON schema in /data/scenarios/ (role, objectionType, difficulty, rubric).

Expose in pages/Practice with filter controls.

Wire voice

Use VoiceAgent + ElevenLabs adapter; cache files via utils/audioCache.ts.

Edge Function

Add supabase/functions/<fn>/index.ts with input validation and JWT check.

Never expose secrets to the client; proxy provider calls here when needed.

Code Contracts
BaseAgent
export interface BaseAgent<Input = any, Output = any> {
  name: string;
  run(input: Input, opts?: AgentOptions): Promise<Output>;
  getPrompt?(input: Input): string;       // optional: used by builder
  handleResponse?(raw: unknown): Output;  // optional: map provider -> app shape
}

Agent Registry
type AgentKey = 'objection' | 'feedback' | 'scenario' | 'voice';

export const AgentRegistry = {
  register(key: AgentKey, agent: BaseAgent) { /* ... */ },
  get<T = BaseAgent>(key: AgentKey): T { /* ... */ }
};

Prompt Builder
const payload = promptBuilder()
  .system(systemText)
  .messages([{ role:'user', content:userText }])
  .model(modelId)
  .temperature(0.6)
  .build();

Example Usage
// register
import { AgentRegistry } from '@/lib/ai/agents';
import { ObjectionAgent } from '@/lib/ai/agents/ObjectionAgent';
AgentRegistry.register('objection', new ObjectionAgent());

// call
const agent = AgentRegistry.get('objection');
const result = await agent.run({
  transcript, productContext, tone: 'empathetic'
});

Security Rules (must follow)

RLS enforced for all user tables; verify JWT in every Edge Function.

Secrets only in Edge Functions / server; never in client build.

Input validation with zod/yup before any provider call.

Production logs: use a safe logger; no raw PII or tokens.

Testing

Unit: Vitest with mocks for AI + Supabase (src/tests/mocks).

E2E: Playwright happy path (auth → practice → feedback).

CI: run vite build, vitest run, and typecheck.

Helpful Scripts

npm run dev – Vite dev server

npm run build – Production build

npm run test – Vitest

npm run typecheck – TS

Provider Notes

OpenAI/Claude: choose via strategies/modelStrategy.ts; default gpt-4o-mini for cost/speed.

ElevenLabs: map tone/emotion from feedback scores.

Rate limits: centralize retries/backoff in adapters.

Files to Consult First

src/lib/ai/agents/*

src/lib/ai/builder/promptBuilder.ts

src/lib/ai/strategies/*

supabase/functions/*

src/constants/*

What NOT to do

Don’t add WordPress/Elementor code or assumptions.

Don’t introduce dark mode or deep component trees.

Don’t call providers directly from components — route through adapters or Edge Functions.

When in doubt

Prefer small, typed modules; keep UI dumb, logic in lib/; write a test.

Minimal ENV Checklist

Client (.env):

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=


Server (Edge Functions secrets):

OPENAI_API_KEY
ANTHROPIC_API_KEY
ELEVENLABS_API_KEY

Collaboration

If conventions are unclear, open a short PR updating this file and src/lib/ai/README.md.

Changelog

Keep this doc in PRs when adding agents, providers, or security changes.

End of file
Quick add steps
# from repo root
mkdir -p .github
# create/overwrite the file with the contents above
git add .github/copilot-instructions.md
git commit -m "docs(copilot): instructions for PitchPerfectAI.ai (React+Supabase, agents, security)"
git push
