# 🧠 Copilot Instructions for AI Coding Agents — PitchPerfectAI.ai

## TL;DR Guardrails
- **Stack:** React (Vite) + TypeScript + TailwindCSS + Supabase (Auth, DB, Edge Functions)
- **Style:** Functional components, hooks, **light mode only**, Tailwind utilities (no CSS modules)
- **Data:** Read/write via `src/lib/supabase/client.ts` (never instantiate Supabase ad-hoc)
- **AI Calls:** Always go through adapters in `src/lib/ai/adapters` or Supabase Edge Functions (no secrets in client)
- **Agents:** Implement `BaseAgent` in `src/lib/ai/agents` and register in `agentRegistry.ts`
- **Validation:** Use **zod** before any network or AI call
- **Errors:** Throw typed errors; surface user-safe messages; log via Supabase logger util
- **Testing:** Vitest for unit, Playwright for E2E
- **Commits:** Use Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Do not:** add WordPress/Elementor code, deep component trees (>3 levels), or raw provider calls from UI

---

## 🧱 Architectural Patterns
- **Factory** – Create/register AI Agents (Chat, Objection, Feedback, Voice)
- **Strategy** – Pluggable model/providers per feature (OpenAI/Claude/Gemini)
- **Adapter** – Wrap SDKs (Supabase, OpenAI, ElevenLabs) behind interfaces
- **Builder** – Prompt/payload builders for consistent requests
- **Dependency Inversion** – Depend on interfaces; mock in tests

---

## 📁 Directory Map (Authoritative)
src/
components/ # Chat, Recorder, Feedback, Decks, UI primitives
pages/ # Home, Practice, Scenarios, Settings
hooks/ # useAuth, useRealtime, useAudio, useAgent
contexts/ # User/Session/Theme (light-only)
lib/
ai/
agents/ # ObjectionAgent, FeedbackAgent, ScenarioAgent, VoiceAgent
strategies/ # modelStrategy, scoring, tone rules
builder/ # promptBuilder.ts, payloadBuilder.ts
adapters/ # openai.ts, claude.ts, elevenlabs.ts
supabase/ # client.ts, edge.ts, rls.ts, logger.ts
utils/ # validators, formatters, audioCache, telemetry
constants/ # TEXT.ts, ROUTES.ts, MODELS.ts
supabase/functions/ # secure provider proxies, scoring, auth utils

---

## 🧩 What Copilot Should Do (Task Recipes)

### ➕ Add a New AI Agent
1. Create `src/lib/ai/agents/<Name>Agent.ts` implementing `BaseAgent`
2. Register it in `agentRegistry.ts`
3. Add defaults to `constants/MODELS.ts`
4. Expose a hook `useAgent('<key>')` if needed

### 🧠 Create a New Scenario Type
1. Add JSON schema under `/data/scenarios/` (role, objectionType, difficulty, rubric)
2. Render it in `pages/Practice` with filter controls

### 🎙️ Wire Voice
- Use `VoiceAgent` + `adapters/elevenlabs.ts`
- Cache generated audio with `utils/audioCache.ts`

### ⚙️ Add a New Edge Function
- Add folder `supabase/functions/<fn>/index.ts`
- Validate input with **zod**
- Verify JWT before any request
- Never expose secrets to the client

---

## 🪶 Coding Conventions
- **Components:** `PascalCase`
- **Utilities:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Max Component Nesting:** 3 levels; lift state up or use Context
- **Controlled Inputs Only**; avoid `any`
- **Tailwind First**; extract primitives if classes repeat
- **Light Mode Only** for iOS visibility

---

## 🔒 Security & Env Rules
- **RLS** enforced on all user tables
- **JWT validation** required in every Edge Function
- **Secrets** only in Edge Functions (never client)
- **Env Vars:**
  - Client: `VITE_*`
  - Server: plain secret keys
- **Rate Limits / Retries:** handled in `adapters/*`
- **Error Logging:** via `src/lib/supabase/logger.ts` or safe console wrappers

---

## 🧪 Testing & Scripts
- **Unit Tests:** Vitest (`npm run test`)
- **E2E Tests:** Playwright (auth → practice → feedback)
- **Type Checking:** `npm run typecheck`
- **Scripts:**
  ```bash
  npm run dev       # Vite dev server
  npm run build     # Production build
  npm run test      # Unit tests
  npm run typecheck # TypeScript check
💡 Example Implementations
BaseAgent Interface (src/lib/ai/agents/types.ts)
export interface BaseAgent<Input = unknown, Output = unknown> {
  name: string;
  run(input: Input, opts?: { model?: string; temperature?: number }): Promise<Output>;
  getPrompt?(input: Input): string;
  handleResponse?(raw: unknown): Output;
}

Agent Registry (src/lib/ai/agents/agentRegistry.ts)
type AgentKey = 'objection' | 'feedback' | 'scenario' | 'voice';

const registry = new Map<AgentKey, BaseAgent>();

export const AgentRegistry = {
  register: (key: AgentKey, agent: BaseAgent) => {
    registry.set(key, agent);
  },
  get<T extends BaseAgent>(key: AgentKey): T {
    const agent = registry.get(key);
    if (!agent) throw new Error(`Agent not registered: ${key}`);
    return agent as T;
  },
  list() {
    return Array.from(registry.keys());
  },
};

Prompt Builder Example (src/lib/ai/builder/promptBuilder.ts)
const payload = promptBuilder()
  .system(systemText)
  .messages([{ role: 'user', content: userText }])
  .model(modelId ?? 'gpt-4o-mini')
  .temperature(0.6)
  .build();

❌ Don’t Do This

❌ Fetch Supabase directly from components
→ ✅ Use lib/supabase/client.ts

❌ Create one-off OpenAI calls in UI
→ ✅ Use adapters or Edge Functions

❌ Add WordPress/Elementor or PHP code

❌ Introduce dark mode or global mutable state

❌ Return unvalidated provider output to UI (always zod-validate)

🌐 Minimal Env Checklist
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server (Edge Functions secrets)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=

🧭 When in Doubt

Keep modules small, typed, and composable

Keep UI dumb; put logic in lib/

Always write or update a test when changing logic

Follow the patterns in this doc before introducing new ones

📘 Collaboration

If conventions evolve, update:

.github/copilot-instructions.md

src/lib/ai/README.md

src/lib/ai/agents/types.ts

Commit with:

docs(copilot): update conventions or patterns


End of Copilot Instructions


---

