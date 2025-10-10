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
## Copilot Instructions for AI Coding Agents

## Project Overview
This codebase is a WordPress site with a focus on extensibility via plugins, notably the Uncanny Automator AI Framework. The AI framework enables integration of multiple AI providers into WordPress automation workflows, using clean architecture and design patterns to keep code maintainable and testable.


## Key Architectural Patterns
- **Factory Pattern**: Used for AI provider creation (see `provider-factory.php`).
- **Strategy Pattern**: Each AI provider implements a common interface, allowing easy swapping (e.g., OpenAI, Claude).
- **Adapter Pattern**: WordPress-specific logic is isolated in adapters, keeping core AI logic decoupled.
- **Builder Pattern**: Used for constructing API requests with a fluent interface.
- **Dependency Inversion**: All provider dependencies are injected via interfaces, enabling easy mocking/testing.


## Directory Structure Highlights
- `wp-content/plugins/uncanny-automator/src/core/lib/ai/`
  - `core/interfaces/`: Contracts for framework components
  - `factory/provider-factory.php`: Provider registration/creation
  - `provider/`: AI provider implementations
  - `adapters/`: WordPress integration layer
  - `exceptions/`: Error handling
  - `load.php`: Bootstrap and provider registration


## Developer Workflows
- **Adding a Provider**: Implement `AI_Provider_Interface`, register in `load.php` via `Provider_Factory::register_provider()`.
- **Creating Actions**: Use provided traits (e.g., `Base_AI_Provider_Trait`) in your action class. Request a provider via `$this->get_provider('PROVIDER_NAME')`.
- **Testing**: Mock interfaces (e.g., `Http_Client_Interface`) for unit tests. Example in the AI framework README.
- **Configuration**: API keys and settings are stored in WordPress options (e.g., `automator_{provider}_api_key`).
- **HTTP**: All external requests use WordPress's `wp_remote_post()` via the framework's HTTP client interface.
- **Logging**: Use the provided logger interface, which integrates with WordPress logging.
- **Error Handling**: Use framework exceptions (`AI_Service_Exception`, `Validation_Exception`, etc.) for robust error management.


## Project-Specific Conventions
- **No deep inheritance**: Max 2-3 levels, prefer composition and interfaces.
- **Direct WordPress API use**: Where appropriate, don't over-abstract.
- **Settings pages**: Defined as arrays, not custom classes/views.
- **Data objects**: Request/Response objects are immutable after creation.
- **Extensibility**: Use WordPress actions/filters for extension points.


## Example: Registering a Provider
```php
Provider_Factory::register_provider('OPENAI', OpenAI_Provider::class);
```


## Example: Using a Provider in an Action
```php
$provider = $this->get_provider('OPENAI');
$payload = $provider->create_builder()
    ->endpoint('https://api.openai.com/v1/chat/completions')
    ->model($model)
    ->messages($this->create_simple_message($system, $prompt))
    ->build();
$response = $provider->send_request($payload);
```


## Key Files to Reference
- `wp-content/plugins/uncanny-automator/src/core/lib/ai/README.md` (full framework docs)
- `provider-factory.php`, `provider/`, `adapters/`, `exceptions/`, `load.php`


---


For questions or unclear conventions, review the AI framework README or ask for clarification. Please suggest improvements to this file if you discover new patterns or workflows.



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

