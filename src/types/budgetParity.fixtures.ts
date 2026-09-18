// Generalization Phase 1 parity fixtures.
// Engine-agnostic: runParityCases executes a deterministic section-12 case
// matrix against any engine implementing ParityEngine and returns
// JSON-serializable outputs. The golden file is generated from the
// pre-extraction budget implementation; the parity test replays the same
// cases against the generalized engine and compares.
export interface ParityCommand {
  sessionId: string;
  turnId: string;
  owner: string;
  action: "start" | "turn" | "pause" | "resume" | "tick" | "close" | "engaged";
  activitySequence?: number;
  expectedTurn: number;
  input: string;
}
export interface ParityRow {
  id: string;
  owner: string;
  version: number;
  document: unknown;
}
export interface ParityStore {
  get(id: string): Promise<ParityRow | null>;
  create(row: ParityRow): Promise<boolean>;
  cas(row: ParityRow, document: unknown): Promise<boolean>;
}
export interface ParityModel {
  evaluate(rep: string, snapshot: unknown): Promise<unknown>;
  render(rep: string, snapshot: unknown, after: unknown): Promise<string>;
}
export interface ParityEngine {
  readonly engineName: string;
  initialState(): unknown;
  opening(): string;
  reduce(
    before: unknown,
    raw: unknown,
    rep: string,
    prospect: string,
    elapsedMs: number,
  ): unknown;
  parseProposal(raw: unknown): unknown;
  allowed(from: string, to: string): boolean;
  handle(
    cmd: ParityCommand,
    store: ParityStore,
    model: ParityModel,
    now?: () => number,
  ): Promise<unknown>;
}

export class ParityMemory implements ParityStore {
  rows = new Map<string, ParityRow>();
  async get(id: string) {
    return structuredClone(this.rows.get(id) ?? null);
  }
  async create(row: ParityRow) {
    if (this.rows.has(row.id)) return false;
    this.rows.set(row.id, structuredClone(row));
    return true;
  }
  async cas(row: ParityRow, document: unknown) {
    if (this.rows.get(row.id)?.version !== row.version) return false;
    this.rows.set(
      row.id,
      structuredClone({ ...row, version: row.version + 1, document }),
    );
    return true;
  }
}

const REP =
  "Can we measure the cost of order rework before discussing funding?";

function proposal(behaviors: string[], extra: Record<string, unknown> = {}) {
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
      quote: REP,
      prospectQuote: "PLACEHOLDER_OPENING",
    })),
    ...extra,
  };
}

const STATES = [
  "ANSWERED",
  "GUARDED",
  "ENGAGED",
  "SKEPTICAL",
  "OBJECTION",
  "LOSING_INTEREST",
  "NEXT_STEP_EARNED",
  "HUNG_UP",
];

const norm = (v: unknown) => JSON.parse(JSON.stringify(v));

function scriptedModel(
  opening: string,
  behaviors: string[] = ["discovery"],
    renderText = "What would that cost?",
    hooks: { onEvaluate?: () => void; onRender?: () => void } = {},
  ): ParityModel {
    return {
      evaluate: async () => {
        hooks.onEvaluate?.();
        const p = proposal(behaviors);
        p.evidence = p.evidence.map((e) => ({
          ...e,
          prospectQuote: opening,
        }));
        return p;
      },
      render: async () => {
        hooks.onRender?.();
        return renderText;
      },
    };
  }

function cmd(
  action: ParityCommand["action"],
  turnId = "t1",
  expectedTurn = 0,
  extra: Partial<ParityCommand> = {},
): ParityCommand {
  return {
    action,
    turnId,
    expectedTurn,
    sessionId: "parity-session",
    owner: "parity-owner",
    input: action === "turn" ? REP : "",
    ...extra,
  };
}

export async function runParityCases(
  engine: ParityEngine,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  const OPENING = engine.opening();
  const prop = (behaviors: string[], extra: Record<string, unknown> = {}) => {
    const p = proposal(behaviors, extra);
    p.evidence = (p.evidence as typeof p.evidence).map((e) => ({
      ...e,
      prospectQuote: OPENING,
    }));
    return p;
  };
  const step = (
    s: unknown = engine.initialState(),
    b: string[] = [],
    input = REP,
    elapsed?: number,
  ) => {
    const before = s as { elapsedMs: number };
    return engine.reduce(
      s,
      prop(b),
      input,
      OPENING,
      elapsed ?? before.elapsedMs + 2000,
    );
  };
  const rec = (name: string, v: unknown) => {
    out[name] = norm(v);
  };
  const recThrow = (name: string, fn: () => unknown) => {
    try {
      rec(name, { threw: false, value: fn() });
    } catch (e) {
      rec(name, {
        threw: true,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      });
    }
  };

  // ---- initial state / opening ----
  rec("initial-state", engine.initialState());
  rec("opening", OPENING);

  // ---- allowed transition matrix ----
  const matrix: Record<string, Record<string, boolean>> = {};
  for (const from of STATES) {
    matrix[from] = {};
    for (const to of STATES) matrix[from][to] = engine.allowed(from, to);
  }
  rec("allowed-matrix", matrix);

  // ---- deterministic policy ----
  rec("policy-discovery", step(engine.initialState(), ["discovery"]));
  rec("policy-reflection", step(engine.initialState(), ["reflection"]));
  rec("policy-proof", step(engine.initialState(), ["proof"]));
  rec(
    "policy-discovery-reflection-proof",
    step(engine.initialState(), ["discovery", "reflection", "proof"]),
  );
  rec(
    "policy-objection-handling-first",
    step(engine.initialState(), ["objection_handling"]),
  );
  const acked = step(engine.initialState(), ["objection_handling"]) as {
    primaryObjectionStatus: string;
  };
  rec(
    "policy-objection-handling-resolve",
    engine.reduce(
      acked,
      prop(["objection_handling"], { objectionStatus: "RESOLVED" }),
      REP,
      OPENING,
      4000,
    ),
  );
  const resolved = engine.reduce(
    acked,
    prop(["objection_handling"], { objectionStatus: "RESOLVED" }),
    REP,
    OPENING,
    4000,
  );
  rec(
    "policy-objection-handling-after-resolved",
    engine.reduce(
      resolved,
      prop(["objection_handling"], { objectionStatus: "RESOLVED" }),
      REP,
      OPENING,
      6000,
    ),
  );
  rec(
    "policy-appropriate-ask-early",
    step(engine.initialState(), ["appropriate_ask"]),
  );
  let earn = engine.initialState();
  for (const b of [
    ["discovery"],
    ["objection_handling", "proof"],
    ["objection_handling", "proof"],
    ["proof"],
    ["appropriate_ask"],
  ])
    earn = step(earn, b);
  rec("policy-earn-path", earn);
  rec("policy-generic", step(engine.initialState(), ["generic"]));
  rec("policy-ignoring", step(engine.initialState(), ["ignoring"]));
  rec(
    "policy-repeated-ask",
    step(step(engine.initialState(), ["meeting_ask"]), ["meeting_ask"]),
  );
  rec(
    "policy-rambling",
    step(engine.initialState(), [], `word `.repeat(100).trim()),
  );
  rec("policy-unsupported", step(engine.initialState(), ["unsupported"]));
  rec("policy-contradiction", step(engine.initialState(), ["contradiction"]));
  rec(
    "policy-nonsense-keywords",
    step(engine.initialState(), ["nonsense", "discovery", "proof"]),
  );
  rec("policy-aggression", step(engine.initialState(), ["aggression"]));
  rec("policy-pushing", step(engine.initialState(), ["pushing"]));
  rec(
    "policy-unanchored-discovery",
    engine.reduce(
      engine.initialState(),
      prop(["discovery"]),
      "ROI budget proof meeting",
      OPENING,
      2000,
    ),
  );
  const badQuote = prop(["discovery"]);
  badQuote.evidence = [
    { behavior: "discovery", quote: REP, prospectQuote: "never said this" },
  ];
  rec(
    "policy-unanchored-contextual-quote",
    engine.reduce(engine.initialState(), badQuote, REP, OPENING, 2000),
  );
  rec(
    "policy-model-flags-ignored",
    engine.reduce(
      engine.initialState(),
      prop(["appropriate_ask"], {
        nextStepEarned: true,
        proposedState: "NEXT_STEP_EARNED",
      }),
      REP,
      OPENING,
      2000,
    ),
  );
  rec(
    "policy-extreme-deltas",
    engine.reduce(
      engine.initialState(),
      prop(["nonsense"], {
        deltas: { patience: -1e9, interest: 1e9, trust: -1e9, relevance: 1e9 },
      }),
      REP,
      OPENING,
      0,
    ),
  );
  rec("policy-default-turn", step(engine.initialState(), []));
  const hung = step(engine.initialState(), ["aggression"]);
  rec("policy-terminal-reduce-unchanged", step(hung, ["proof"]));
  rec("policy-sixth-turn-hang", (() => {
    let s = engine.initialState();
    for (let i = 0; i < 6; i++) s = step(s, []);
    return s;
  })());
  rec(
    "policy-hard-duration-hang",
    engine.reduce(engine.initialState(), prop([]), REP, OPENING, 120000),
  );

  // ---- proposal validation ----
  recThrow("parse-valid", () => engine.parseProposal(prop(["discovery"])));
  recThrow("parse-empty", () => engine.parseProposal(null));
  recThrow("parse-text-too-long", () =>
    engine.parseProposal(prop([], { text: "x".repeat(501) })),
  );
  recThrow("parse-bad-state", () =>
    engine.parseProposal(prop([], { proposedState: "NOPE" })),
  );
  recThrow("parse-bad-objection", () =>
    engine.parseProposal(prop([], { objectionStatus: "MAYBE" })),
  );
  recThrow("parse-bad-behavior", () =>
    engine.parseProposal(prop(["telepathy"])),
  );
  recThrow("parse-nan-delta", () =>
    engine.parseProposal(
      prop([], { deltas: { patience: NaN, interest: 0, trust: 0, relevance: 0 } }),
    ),
  );
  recThrow("parse-too-much-evidence", () =>
    engine.parseProposal(
      prop(
        Array.from({ length: 15 }, () => "discovery"),
      ),
    ),
  );
  recThrow("parse-empty-quote", () => {
    const p = prop(["discovery"]);
    p.evidence = [{ behavior: "discovery", quote: "  ", prospectQuote: OPENING }];
    return engine.parseProposal(p);
  });

  // ---- reduce-driven transitions ----
  rec(
    "transition-answered-to-guarded",
    (step(engine.initialState(), ["discovery"]) as { state: string }).state,
  );
  rec(
    "transition-bad-to-skeptical",
    (step(engine.initialState(), ["generic"]) as { state: string }).state,
  );
  rec(
    "transition-ack-to-objection",
    (step(engine.initialState(), ["objection_handling"]) as { state: string })
      .state,
  );
  const rel = engine.reduce(
    { ...(engine.initialState() as object), relevance: 40, state: "GUARDED" },
    prop(["discovery"]),
    REP,
    OPENING,
    2000,
  ) as { state: string };
  rec("transition-relevance-to-engaged", rel.state);
  const soft = engine.reduce(
    { ...(engine.initialState() as object), patience: 30, state: "GUARDED" },
    prop([]),
    REP,
    OPENING,
    2000,
  ) as { state: string };
  rec("transition-soft-limit-losing-interest", soft.state);
  rec(
    "transition-illegal-falls-back",
    (
      engine.reduce(
        engine.initialState(),
        prop(["appropriate_ask"], { proposedState: "NEXT_STEP_EARNED" }),
        REP,
        OPENING,
        2000,
      ) as { state: string }
    ).state,
  );

  // ---- terminal rules via reduce ----
  rec("terminal-three-poor", (() => {
    let s = engine.initialState();
    for (let i = 0; i < 3; i++) s = step(s, ["generic"]);
    return s;
  })());
  rec("terminal-two-ignored", (() => {
    let s = engine.initialState();
    for (let i = 0; i < 2; i++) s = step(s, ["ignoring"]);
    return s;
  })());
  rec("terminal-pushing-after-losing-interest", (() => {
    const s = {
      ...(engine.initialState() as object),
      state: "LOSING_INTEREST",
      patience: 30,
    };
    return step(s, ["pushing"]);
  })());
  rec("terminal-patience-zero", (() => {
    const s = {
      ...(engine.initialState() as object),
      patience: 5,
      state: "GUARDED",
    };
    return step(s, ["generic"]);
  })());

  // ---- session protocol ----
  const opened = async () => {
    const store = new ParityMemory();
    await engine.handle(cmd("start"), store, scriptedModel(OPENING), () => 0);
    return store;
  };
  {
    const store = await opened();
    const started = await engine.handle(cmd("start"), store, scriptedModel(OPENING), () => 0);
    rec("session-start-idempotent", started);
    const t1 = await engine.handle(cmd("turn"), store, scriptedModel(OPENING), () => 1000);
    rec("session-turn-ok", t1);
    const replay = await engine.handle(cmd("turn"), store, scriptedModel(OPENING), () => 2000);
    rec("session-receipt-replay-equal", replay);
    rec(
      "session-altered-input-rejected",
      await engine.handle(
        { ...cmd("turn"), input: "different words here" },
        store,
        scriptedModel(OPENING),
        () => 3000,
      ),
    );
    rec(
      "session-stale-version-rejected",
      await engine.handle(cmd("turn", "stale", 0), store, scriptedModel(OPENING), () => 4000),
    );
    rec(
      "session-foreign-owner-rejected",
      await engine.handle(
        { ...cmd("start"), owner: "attacker" },
        store,
        scriptedModel(OPENING),
        () => 5000,
      ),
    );
  }
  {
    const store = await opened();
    const before = norm((await store.get("parity-session"))!.document);
    const failed = await engine.handle(
      cmd("turn"),
      store,
      {
        evaluate: async () => {
          throw new Error("provider unavailable");
        },
        render: async () => "unreachable",
      },
      () => 1000,
    );
    rec("session-failure-result", failed);
    rec(
      "session-failure-preserves-state",
      norm((await store.get("parity-session"))!.document),
    );
    rec("session-failure-preserved-equals-before", before);
    const retry = await engine.handle(cmd("turn"), store, scriptedModel(OPENING), () => 2000);
    rec("session-retry-after-failure", retry);
  }
  {
    const store = await opened();
    const model = scriptedModel(OPENING);
    await Promise.all([
      engine.handle(cmd("turn"), store, model, () => 1000),
      engine.handle(cmd("turn"), store, model, () => 1000),
    ]);
    const r = await engine.handle(cmd("turn"), store, model, () => 2000);
    rec("session-concurrent-single-turn", {
      turnCount: (r as { prospectState?: { turnCount: number } }).prospectState
        ?.turnCount,
      historyLength: (
        (await store.get("parity-session"))!.document as {
          history: unknown[];
        }
      ).history.length,
    });
  }
  {
    // close invalidates an outstanding model result
    const store = await opened();
    let release!: () => void;
    const pending = engine.handle(
      cmd("turn"),
      store,
      {
        evaluate: async () => {
          await new Promise<void>((r) => {
            release = r;
          });
          return prop(["discovery"]);
        },
        render: async () => "late reply",
      },
      () => 1000,
    );
    while (!release) await Promise.resolve();
    const closed = await engine.handle(cmd("close", "close1"), store, scriptedModel(OPENING), () => 1500);
    release();
    const pendingResult = await pending;
    rec("session-close-result", closed);
    rec("session-close-invalidates-pending", pendingResult);
    rec(
      "session-closed-state",
      ((await store.get("parity-session"))!.document as { state: unknown }).state,
    );
  }
  {
    // SESSION_CLOSED: new turn after terminal close
    const store = await opened();
    await engine.handle(cmd("turn"), store, scriptedModel(OPENING), () => 1000);
    await engine.handle(cmd("close", "close1"), store, scriptedModel(OPENING), () => 1500);
    const beforeRow = norm(await store.get("parity-session"));
    let evaluateCalls = 0;
    let renderCalls = 0;
    const closedTurn = await engine.handle(
      { ...cmd("turn", "t2", 1), activitySequence: 0 },
      store,
      scriptedModel(OPENING, ["discovery"], "x", {
        onEvaluate: () => evaluateCalls++,
        onRender: () => renderCalls++,
      }),
      () => 2000,
    );
    rec("session-closed-new-turn", closedTurn);
    rec("session-closed-evaluate-calls", evaluateCalls);
    rec("session-closed-render-calls", renderCalls);
    rec(
      "session-closed-store-unchanged",
      norm(await store.get("parity-session")),
    );
    rec("session-closed-store-before", beforeRow);
    const replayAfterClose = await engine.handle(
      cmd("turn"),
      store,
      scriptedModel(OPENING),
      () => 2500,
    );
    rec("session-receipt-replay-after-close", replayAfterClose);
  }
  {
    // inactivity tick -> HUNG_UP with the activity close line
    const store = await opened();
    await engine.handle({ ...cmd("resume", "a1", 0), activitySequence: 1 }, store, scriptedModel(OPENING), () => 1000);
    const idle = await engine.handle({ ...cmd("tick", "k1", 0), activitySequence: 1 }, store, scriptedModel(OPENING), () => 16000);
    rec("session-tick-inactivity", idle);
  }
  {
    // A turn arriving while the clock is resumed (not paused) is rejected
    // before the model runs; the turn-arrival inactivity branch additionally
    // requires readyAt, which pause clears, so resumed turns fail closed.
    const store = await opened();
    await engine.handle(
      { ...cmd("resume", "a1", 0), activitySequence: 1 },
      store,
      scriptedModel(OPENING),
      () => 1000,
    );
    let evaluateCalls = 0;
    const resumedTurn = await engine.handle(
      { ...cmd("turn", "t1", 0), activitySequence: 1 },
      store,
      scriptedModel(OPENING, ["discovery"], "x", {
        onEvaluate: () => evaluateCalls++,
      }),
      () => 16000,
    );
    rec("session-turn-while-resumed-rejected", resumedTurn);
    rec("session-turn-while-resumed-evaluate-calls", evaluateCalls);
  }
  {
    // hard duration via engaged tick
    const store = await opened();
    await engine.handle({ ...cmd("engaged", "a1", 0), activitySequence: 1 }, store, scriptedModel(OPENING), () => 1000);
    const hard = await engine.handle({ ...cmd("tick", "k1", 0), activitySequence: 1 }, store, scriptedModel(OPENING), () => 121000);
    rec("session-hard-duration-tick", hard);
  }
  {
    // turn requires acknowledged pause with exact sequence
    const store = await opened();
    await engine.handle({ ...cmd("resume", "a1", 0), activitySequence: 1 }, store, scriptedModel(OPENING), () => 1000);
    let evaluateCalls = 0;
    const unpaused = await engine.handle(
      { ...cmd("turn", "t1", 0), activitySequence: 1 },
      store,
      scriptedModel(OPENING, ["discovery"], "x", { onEvaluate: () => evaluateCalls++ }),
      () => 1500,
    );
    rec("session-unpaused-turn-rejected", unpaused);
    rec("session-unpaused-evaluate-calls", evaluateCalls);
  }
  {
    // activity sequencing: superseded rejected, duplicate idempotent
    const store = await opened();
    await engine.handle({ ...cmd("pause", "p2", 0), activitySequence: 2 }, store, scriptedModel(OPENING), () => 2000);
    const superseded = await engine.handle({ ...cmd("pause", "p1", 0), activitySequence: 1 }, store, scriptedModel(OPENING), () => 3000);
    rec("session-superseded-sequence-rejected", superseded);
    const beforeDoc = norm((await store.get("parity-session"))!.document);
    const dup = await engine.handle({ ...cmd("pause", "p2b", 0), activitySequence: 2 }, store, scriptedModel(OPENING), () => 12000);
    rec("session-duplicate-pause-idempotent", dup);
    rec(
      "session-duplicate-pause-doc-unchanged",
      norm((await store.get("parity-session"))!.document),
    );
    rec("session-duplicate-pause-doc-before", beforeDoc);
    const conflict = await engine.handle({ ...cmd("resume", "r2", 0), activitySequence: 2 }, store, scriptedModel(OPENING), () => 13000);
    rec("session-same-sequence-conflicting-intent", conflict);
  }
  {
    // zero-turn close stays unscored
    const store = await opened();
    const closed = await engine.handle(cmd("close"), store, scriptedModel(OPENING), () => 500);
    rec("session-zero-turn-close", closed);
  }
  {
    // expectedTurn gating
    const store = await opened();
    await engine.handle(cmd("turn"), store, scriptedModel(OPENING), () => 1000);
    rec(
      "session-expected-turn-gating",
      await engine.handle(cmd("turn", "t2", 0), store, scriptedModel(OPENING), () => 2000),
    );
    rec(
      "session-expected-turn-ok",
      await engine.handle(cmd("turn", "t2", 1), store, scriptedModel(OPENING), () => 2000),
    );
  }
  {
    // quota failure is non-retryable model error; state untouched
    const store = await opened();
    const quota = await engine.handle(
      cmd("turn"),
      store,
      {
        evaluate: async () => {
          const e = new Error("MODEL_ERROR");
          e.name = "ProviderQuotaError";
          throw e;
        },
        render: async () => "unreachable",
      },
      () => 1000,
    );
    rec("session-quota-failure", quota);
    rec(
      "session-quota-state",
      ((await store.get("parity-session"))!.document as { state: unknown }).state,
    );
  }
  {
    // abort timeout maps to MODEL_TIMEOUT
    const store = await opened();
    const timedOut = await engine.handle(
      cmd("turn"),
      store,
      {
        evaluate: async () => {
          throw new DOMException("aborted", "AbortError");
        },
        render: async () => "unreachable",
      },
      () => 1000,
    );
    rec("session-abort-timeout", timedOut);
  }

  return out;
}
