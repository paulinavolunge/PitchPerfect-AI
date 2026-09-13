import { describe, it, expect } from "vitest";
import {
  initialState,
  reduce,
  allowed,
  parseProposal,
  OPENING,
  type Behavior,
  type Proposal,
} from "../../supabase/functions/_shared/budget/state";
import {
  handleBudget,
  type Row,
  type Snapshot,
  type Store,
  type Command,
} from "../../supabase/functions/_shared/budget/session";
const rep =
  "Can we measure the cost of order rework before discussing funding?";
function proposal(
  behaviors: Behavior[],
  extra: Partial<Proposal> = {},
): Proposal {
  return {
    text: "What would that cost?",
    proposedState: "ENGAGED",
    deltas: { patience: 15, interest: 15, trust: 15, relevance: 15 },
    objectionStatus: "RESOLVED",
    hangUp: false,
    nextStepEarned: false,
    reason: "Observable evidence",
    evidence: behaviors.map((behavior) => ({
      behavior,
      quote: rep,
      prospectQuote: OPENING,
    })),
    ...extra,
  };
}
const step = (s = initialState(), b: Behavior[] = [], input = rep) =>
  reduce(s, proposal(b), input, OPENING, s.elapsedMs + 2000);
export class Memory implements Store {
  rows = new Map<string, Row>();
  async get(id: string) {
    return structuredClone(this.rows.get(id) ?? null);
  }
  async create(row: Row) {
    if (this.rows.has(row.id)) return false;
    this.rows.set(row.id, structuredClone(row));
    return true;
  }
  async cas(row: Row, document: Snapshot) {
    if (this.rows.get(row.id)?.version !== row.version) return false;
    this.rows.set(
      row.id,
      structuredClone({ ...row, version: row.version + 1, document }),
    );
    return true;
  }
}
const command = (
  action: Command["action"],
  turnId = "t1",
  expectedTurn = 0,
): Command => ({
  action,
  turnId,
  expectedTurn,
  sessionId: "session",
  owner: "owner",
  input: action === "turn" ? rep : "",
});
const model = {
  evaluate: async () => proposal(["discovery"]),
  render: async () => "How much rework are you talking about?",
};
describe("Budget deterministic rules", () => {
  it("relevant discovery improves relevance gradually", () => {
    const a = step(initialState(), ["discovery"]);
    expect(a.relevance).toBeGreaterThan(20);
    expect(a.state).toBe("GUARDED");
    expect(a.nextStepEarned).toBe(false);
  });
  it("objection handling improves trust", () =>
    expect(step(initialState(), ["objection_handling"]).trust).toBeGreaterThan(
      25,
    ));
  it("contextual proof improves interest", () =>
    expect(step(initialState(), ["proof"]).interest).toBeGreaterThan(20));
  it("earns a next step only after gradual handling and proof", () => {
    let s = initialState();
    for (const b of [
      ["discovery"],
      ["objection_handling", "proof"],
      ["objection_handling", "proof"],
      ["proof"],
      ["appropriate_ask"],
    ] as Behavior[][])
      s = step(s, b);
    expect(s.nextStepEarned).toBe(true);
  });
  it.each([
    "generic",
    "ignoring",
    "rambling",
    "nonsense",
    "contradiction",
  ] as Behavior[])("%s degrades state", (b) => {
    const a = step(initialState(), [b]);
    expect(a.patience).toBeLessThan(80);
    expect(a.trust).toBeLessThan(25);
  });
  it("repeated meeting asks degrade state", () => {
    const a = step(step(initialState(), ["meeting_ask"]), ["meeting_ask"]);
    expect(a.poorTurns).toBe(1);
  });
  it("long input is penalized even if evaluator omits rambling", () =>
    expect(step(initialState(), [], "word ".repeat(100)).patience).toBeLessThan(
      80,
    ));
  it("keyword-rich nonsense cannot gain positive state", () => {
    const a = step(initialState(), ["nonsense", "discovery", "proof"]);
    expect(a.relevance).toBe(0);
    expect(a.interest).toBe(0);
  });
  it("unanchored positive evidence gains nothing", () =>
    expect(
      step(initialState(), ["discovery"], "ROI budget proof meeting").relevance,
    ).toBe(20));
  it("aggression can cause immediate hang-up", () =>
    expect(step(initialState(), ["aggression"]).hungUp).toBe(true));
  it("three poor turns hang up", () => {
    let s = initialState();
    for (let i = 0; i < 3; i++) s = step(s, ["generic"]);
    expect(s.hungUp).toBe(true);
  });
  it("all metric values stay bounded under extreme proposals", () => {
    const p = proposal(["nonsense"], {
      deltas: { patience: -1e9, interest: 1e9, trust: -1e9, relevance: 1e9 },
    });
    const a = reduce(initialState(), p, rep, OPENING, 0);
    for (const k of ["patience", "interest", "trust", "relevance"] as const) {
      expect(a[k]).toBeGreaterThanOrEqual(0);
      expect(a[k]).toBeLessThanOrEqual(100);
    }
  });
  it("rejects impossible transitions", () => {
    expect(allowed("ANSWERED", "NEXT_STEP_EARNED")).toBe(false);
    expect(step(initialState(), ["appropriate_ask"]).state).not.toBe(
      "NEXT_STEP_EARNED",
    );
  });
  it("HUNG_UP is terminal", () => {
    const s = step(initialState(), ["aggression"]);
    expect(step(s, ["proof"])).toEqual(s);
  });
  it("model flags cannot bypass thresholds", () => {
    const a = reduce(
      initialState(),
      proposal(["appropriate_ask"], {
        nextStepEarned: true,
        proposedState: "NEXT_STEP_EARNED",
      }),
      rep,
      OPENING,
      0,
    );
    expect(a.nextStepEarned).toBe(false);
  });
  it("rejects invalid schema and nonfinite numbers", () =>
    expect(() =>
      parseProposal(
        proposal([], {
          deltas: { patience: NaN, interest: 0, trust: 0, relevance: 0 },
        }),
      ),
    ).toThrow());
  it("hard duration and sixth turn end a weak call", () => {
    expect(
      reduce(initialState(), proposal([]), rep, OPENING, 120000).hungUp,
    ).toBe(true);
    let s = initialState();
    for (let i = 0; i < 6; i++) s = step(s, []);
    expect(s.hungUp).toBe(true);
  });
});
describe("Budget session transactions", () => {
  async function opened() {
    const store = new Memory();
    await handleBudget(command("start"), store, model, () => 0);
    return store;
  }
  it("infrastructure failure preserves state and transcript", async () => {
    const store = await opened();
    const before = (await store.get("session"))!.document;
    const result = await handleBudget(
      command("turn"),
      store,
      {
        ...model,
        evaluate: async () => {
          throw new Error("provider unavailable");
        },
      },
      () => 1000,
    );
    expect(result.ok).toBe(false);
    const after = (await store.get("session"))!.document;
    expect(after.state).toEqual(before.state);
    expect(after.history).toEqual(before.history);
  });
  it("retry after failure succeeds once", async () => {
    const store = await opened();
    await handleBudget(command("turn"), store, {
      ...model,
      render: async () => {
        throw new Error("failed");
      },
    });
    const a = await handleBudget(command("turn"), store, model);
    const b = await handleBudget(command("turn"), store, model);
    expect(b).toEqual(a);
    expect(b.prospectState?.turnCount).toBe(1);
  });
  it("concurrent retries apply only one logical turn", async () => {
    const store = await opened();
    await Promise.all([
      handleBudget(command("turn"), store, model),
      handleBudget(command("turn"), store, model),
    ]);
    const r = await handleBudget(command("turn"), store, model);
    expect(r.prospectState?.turnCount).toBe(1);
    expect((await store.get("session"))!.document.history).toHaveLength(3);
  });
  it("stale version cannot advance state", async () => {
    const store = await opened();
    await handleBudget(command("turn"), store, model);
    expect(
      (await handleBudget(command("turn", "stale", 0), store, model)).ok,
    ).toBe(false);
    expect((await store.get("session"))!.document.state.turnCount).toBe(1);
  });
  it("same id with altered text is rejected", async () => {
    const store = await opened();
    await handleBudget(command("turn"), store, model);
    expect(
      (
        await handleBudget(
          { ...command("turn"), input: "different" },
          store,
          model,
        )
      ).ok,
    ).toBe(false);
  });
  it("another owner cannot read a session", async () => {
    const store = await opened();
    expect(
      (
        await handleBudget(
          { ...command("start"), owner: "attacker" },
          store,
          model,
        )
      ).ok,
    ).toBe(false);
  });
  it("close invalidates an outstanding model result", async () => {
    const store = await opened();
    let resolve!: () => void;
    const pending = handleBudget(command("turn"), store, {
      ...model,
      evaluate: async () => {
        await new Promise<void>((r) => (resolve = r));
        return proposal(["discovery"]);
      },
    });
    while (!resolve) await Promise.resolve();
    await handleBudget(command("close"), store, model);
    resolve();
    expect((await pending).ok).toBe(false);
    expect((await store.get("session"))!.document.state.hungUp).toBe(true);
  });
  it("speaking disables inactivity but still counts against hard duration", async () => {
    const store = await opened();
    await handleBudget({...command("engaged"), activitySequence:1}, store, model, () => 1000);
    expect(
      (await handleBudget({...command("tick"), activitySequence:1}, store, model, () => 17000))
        .prospectState?.hungUp,
    ).toBe(false);
    expect(
      (await handleBudget({...command("tick"), activitySequence:1}, store, model, () => 121000))
        .prospectState?.hungUp,
    ).toBe(true);
  });
  it("paused voice or TTS time is excluded and idle timeout is server-owned", async () => {
    const store = await opened();
    await handleBudget({...command("resume"), activitySequence:1}, store, model, () => 1000);
    await handleBudget({...command("pause"), activitySequence:2}, store, model, () => 2000);
    const paused = await handleBudget(
      {...command("tick"), activitySequence:2},
      store,
      model,
      () => 900000,
    );
    expect(paused.prospectState?.hungUp).toBe(false);
    await handleBudget({...command("resume"), activitySequence:3}, store, model, () => 900000);
    const idle = await handleBudget(
      {...command("tick"), activitySequence:3},
      store,
      model,
      () => 915000,
    );
    expect(idle.prospectState?.hungUp).toBe(true);
    expect(idle.prospectState?.elapsedMs).toBe(15000);
  });
});
