// Generalization Phase 1 — Budget parity.
// Replays the deterministic section-12 case matrix (captured pre-extraction
// in budgetParity.golden.json) against the generalized engine, through both
// the Budget compatibility wrappers and the prospect modules directly.
// Any behavioral drift fails here.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  runParityCases,
  type ParityCommand,
  type ParityEngine,
  type ParityModel,
  type ParityStore,
} from "./budgetParity.fixtures";
import {
  allowed,
  BEHAVIORS,
  initialState,
  OPENING,
  parseProposal,
  reduce,
  STATES,
  type Proposal,
  type ProspectState,
} from "../../supabase/functions/_shared/budget/state";
import {
  handleBudget,
  type Command,
  type Model,
  type Store,
} from "../../supabase/functions/_shared/budget/session";
import { BUDGET_CONFIG } from "../../supabase/functions/_shared/prospect/scenarios/budget";
import {
  allowed as prospectAllowed,
  parseProposal as prospectParseProposal,
  reduce as prospectReduce,
} from "../../supabase/functions/_shared/prospect/state";
import { handleProspect } from "../../supabase/functions/_shared/prospect/session";
import {
  buildOutputSchema,
  prospectRequest,
} from "../../supabase/functions/_shared/prospect/adapter";
import {
  getScenarioConfig,
  SCENARIO_IDS,
} from "../../supabase/functions/_shared/prospect/registry";
import { budgetRequest } from "../../supabase/functions/_shared/budget/adapter";

const golden: Record<string, unknown> = JSON.parse(
  readFileSync("src/types/budgetParity.golden.json", "utf8"),
);

const wrapperEngine: ParityEngine = {
  engineName: "budget-compatibility-wrapper",
  initialState: () => initialState(),
  opening: () => OPENING,
  reduce: (before, raw, rep, prospect, elapsedMs) =>
    reduce(before as ProspectState, raw, rep, prospect, elapsedMs),
  parseProposal: (raw) => parseProposal(raw) as unknown,
  allowed: (from, to) =>
    allowed(from as (typeof STATES)[number], to as (typeof STATES)[number]),
  handle: (cmd: ParityCommand, store: ParityStore, model: ParityModel, now?: () => number) =>
    handleBudget(
      cmd as Command,
      store as unknown as Store,
      model as unknown as Model,
      now,
    ) as Promise<unknown>,
};

const prospectEngine: ParityEngine = {
  engineName: "prospect-engine-with-budget-config",
  initialState: () => BUDGET_CONFIG.initialState(),
  opening: () => BUDGET_CONFIG.opening,
  reduce: (before, raw, rep, prospect, elapsedMs) =>
    prospectReduce(
      before as ProspectState,
      raw,
      rep,
      prospect,
      elapsedMs,
      BUDGET_CONFIG,
    ),
  parseProposal: (raw) => prospectParseProposal(raw, BUDGET_CONFIG) as unknown,
  allowed: (from, to) =>
    prospectAllowed(from, to, BUDGET_CONFIG.transitions),
  handle: (cmd: ParityCommand, store: ParityStore, model: ParityModel, now?: () => number) =>
    handleProspect(
      cmd as Command,
      store as unknown as Store,
      model as unknown as Model,
      BUDGET_CONFIG,
      now,
    ) as Promise<unknown>,
};

describe("Budget parity: generalized engine reproduces validated behavior", () => {
  it.each([wrapperEngine, prospectEngine])(
    "$engineName matches the pre-extraction golden on every case",
    async (engine) => {
      const actual = await runParityCases(engine);
      expect(Object.keys(actual).sort()).toEqual(
        Object.keys(golden).sort(),
      );
      for (const [name, expected] of Object.entries(golden)) {
        expect(actual[name], `${engine.engineName}: ${name}`).toEqual(expected);
      }
    },
    120000,
  );

  it("scenario registry fails closed on unknown ids", () => {
    expect(getScenarioConfig("budget").scenarioId).toBe("budget");
    expect(SCENARIO_IDS).toEqual(["budget", "email"]);
    for (const bad of [
      "think",
      "budget ",
      "Budget",
      "__proto__",
      "",
      null,
      undefined,
      {},
    ])
      expect(() => getScenarioConfig(bad)).toThrow("UNKNOWN_SCENARIO");
  });

  it("generated Budget output schema matches the validated contract shape", () => {
    const schema = buildOutputSchema(BUDGET_CONFIG) as {
      properties: Record<string, { enum?: unknown }>;
      required: string[];
    };
    expect(schema.required).toEqual([
      "text",
      "proposedState",
      "deltas",
      "objectionStatus",
      "hangUp",
      "nextStepEarned",
      "reason",
      "evidence",
    ]);
    expect(schema.properties.proposedState.enum).toEqual([...STATES]);
    expect(
      (
        schema.properties.evidence as unknown as {
          items: { properties: { behavior: { enum: unknown } } };
        }
      ).items.properties.behavior.enum,
    ).toEqual([...BEHAVIORS]);
    expect(schema.properties.objectionStatus.enum).toEqual([
      "UNADDRESSED",
      "ACKNOWLEDGED",
      "RESOLVED",
    ]);
  });

  it("config literals match the wrapper exports", () => {
    expect([...BUDGET_CONFIG.states]).toEqual([...STATES]);
    expect([...BUDGET_CONFIG.behaviors]).toEqual([...BEHAVIORS]);
    expect(BUDGET_CONFIG.opening).toBe(OPENING);
  });

  it("budgetRequest compatibility wrapper still delegates to the shared adapter", async () => {
    // No provider call: an invalid body fails before any model work.
    const result = (await budgetRequest(
      { sessionId: "x".repeat(101) },
      "owner",
      null,
      "key",
    )) as { ok: boolean; errorType: string };
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe("INVALID_RESPONSE");
    expect(typeof prospectRequest).toBe("function");
  });

  it("proposal type surface is unchanged", () => {
    const p: Proposal = parseProposal({
      text: "t",
      proposedState: "GUARDED",
      deltas: { patience: 0, interest: 0, trust: 0, relevance: 0 },
      objectionStatus: "UNADDRESSED",
      hangUp: false,
      nextStepEarned: false,
      reason: "r",
      evidence: [],
    });
    expect(p.proposedState).toBe("GUARDED");
  });
});
