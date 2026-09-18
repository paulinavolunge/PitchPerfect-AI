// Scenario-neutral prospect adapter: service-role persistence, OpenAI
// orchestration and the shared session engine. Ported verbatim from the
// validated Budget adapter; scenario-owned values (table, prompts, schema,
// model parameters) come from the resolved ScenarioConfig.
import { fetchOpenAI, isQuotaFailure } from "../openaiRetry.ts";
import type { ScenarioConfig } from "./config.ts";
import { getScenarioConfig } from "./registry.ts";
import { handleProspect } from "./session.ts";
import type { Row, Snapshot, Store } from "./types.ts";

// Server-only store; never instantiated in the browser. Postgres UPDATE ... WHERE version is atomic.
export function prospectDatabaseStore(db: any, table: string): Store {
  return {
    async get(id) {
      const { data, error } = await db
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },
    async create(row) {
      const { error } = await db.from(table).insert(row);
      if (error && error.code !== "23505") throw error;
      return !error;
    },
    async cas(row, document) {
      const { data, error } = await db
        .from(table)
        .update({ document, version: row.version + 1 })
        .eq("id", row.id)
        .eq("owner", row.owner)
        .eq("version", row.version)
        .select("id");
      if (error) throw error;
      return data.length === 1;
    },
  };
}

const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export function buildOutputSchema(config: ScenarioConfig) {
  return object({
    text: { type: "string" },
    proposedState: { type: "string", enum: config.states },
    deltas: object({
      patience: { type: "number" },
      interest: { type: "number" },
      trust: { type: "number" },
      relevance: { type: "number" },
    }),
    objectionStatus: {
      type: "string",
      enum: ["UNADDRESSED", "ACKNOWLEDGED", "RESOLVED"],
    },
    hangUp: { type: "boolean" },
    nextStepEarned: { type: "boolean" },
    reason: { type: "string" },
    evidence: {
      type: "array",
      items: object({
        behavior: { type: "string", enum: config.behaviors },
        quote: { type: "string" },
        prospectQuote: { type: "string" },
      }),
    },
  });
}

export interface ProspectRequestArgs {
  body: any;
  owner: string;
  db: any;
  key: string;
  scenarioId: string;
  storeOverride?: Store;
}

export async function prospectRequest(
  args: ProspectRequestArgs,
): Promise<unknown> {
  const { body, owner, db, key, storeOverride } = args;
  const config = getScenarioConfig(args.scenarioId);
  const outputSchema = buildOutputSchema(config);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 27000);
  async function completion(
    system: string,
    s: Snapshot,
    rep: string,
    json: boolean,
  ) {
    const res = await fetchOpenAI("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model.name,
        temperature: config.model.temperature,
        max_tokens: config.model.maxTokens,
        ...(json
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: config.outputSchemaName,
                  strict: true,
                  schema: outputSchema,
                },
              },
            }
          : {}),
        messages: [
          { role: "system", content: system },
          ...s.history,
          { role: "user", content: rep },
        ],
      }),
    });
    if (!res.ok) {
      const error = new Error("MODEL_ERROR");
      if (isQuotaFailure(res.status, await res.text()))
        error.name = "ProviderQuotaError";
      throw error;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content;
  }
  try {
    return await handleProspect(
      {
        sessionId: body.sessionId,
        turnId: body.turnId,
        owner,
        action: body.budgetAction ?? "turn",
        expectedTurn: body.budgetVersion ?? 0,
        activitySequence: body.budgetActivitySequence,
        input: body.userInput ?? "",
      },
      storeOverride ?? prospectDatabaseStore(db, config.table),
      {
        async evaluate(rep, s) {
          const evaluated = JSON.parse(
            await completion(config.evaluatePrompt(s), s, rep, true),
          );
          return evaluated;
        },
        async render(rep, s, after) {
          return await completion(config.renderPrompt(after), s, rep, false);
        },
      },
      config,
    );
  } finally {
    clearTimeout(timer);
  }
}
