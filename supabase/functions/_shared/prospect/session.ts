// Scenario-neutral prospect session protocol.
// Ported verbatim from the validated Budget implementation: session
// creation, owner binding, logical-turn receipts, atomic versioned CAS,
// receipt replay before terminal rejection, acknowledged monotonic activity
// sequencing, infrastructure-latency protection and TTS-lifecycle-aware
// resume. Only scenario-owned values (initial state, opening, close lines,
// duration limits, terminal state names, policy) come from config.
import type { ScenarioConfig } from "./config.ts";
import {
  parseProposal,
  reduce,
  telemetry,
} from "./state.ts";
import type {
  ActivityAck,
  Command,
  Model,
  ProspectState,
  Result,
  Row,
  Snapshot,
  Store,
} from "./types.ts";

export async function handleProspect(
  c: Command,
  store: Store,
  model: Model,
  config: ScenarioConfig,
  now = () => Date.now(),
): Promise<Result> {
  const started = now();
  let failureState: ProspectState | undefined;
  const fail = (errorType: string): Result => ({
    ok: false,
    sessionId: c.sessionId,
    turnId: c.turnId,
    errorType,
    retryable: true,
    stateTelemetry: failureState
      ? telemetry(failureState, failureState)
      : undefined,
    latencyMs: now() - started,
  });
  const validId = /^[a-zA-Z0-9_-]{1,100}$/;
  if (
    !["start", "turn", "pause", "resume", "tick", "close", "engaged"].includes(
      c.action,
    ) ||
    !validId.test(c.sessionId) ||
    !validId.test(c.turnId) ||
    !c.owner ||
    !Number.isInteger(c.expectedTurn) ||
    typeof c.input !== "string" ||
    c.input.length > 12000
  )
    return fail("INVALID_RESPONSE");
  let row = await store.get(c.sessionId);
  if (!row && c.action === "start") {
    const doc: Snapshot = {
      activity: { sequence: 0, mode: "pause", checkpointAt: null },
      state: config.initialState(),
      history: [{ role: "assistant", content: config.opening }],
      receipts: {},
      readyAt: null,
      engaged: false,
      activeMs: 0,
      pending: null,
    };
    await store.create({
      id: c.sessionId,
      owner: c.owner,
      version: 0,
      document: doc,
    });
    row = await store.get(c.sessionId);
  }
  if (!row || row.owner !== c.owner) return fail("INVALID_RESPONSE");
  const s = row.document;
  failureState = s.state;
  const receipt = s.receipts[c.turnId];
  if (receipt)
    return receipt.input === c.input && c.action === "turn"
      ? receipt.result
      : fail("INVALID_RESPONSE");
  const result = (doc: Snapshot): Result => ({
    ok: true,
    sessionId: c.sessionId,
    turnId: c.turnId,
    response: doc.history[doc.history.length - 1]?.content,
    prospectState: doc.state,
    version: doc.state.turnCount,
    activityAck: {
      sessionId: c.sessionId,
      sequence: doc.activity.sequence,
      mode: doc.activity.mode,
    },
    stateTelemetry: telemetry(s.state, doc.state),
    latencyMs: now() - started,
  });
  if (c.action === "start")
    return s.state.turnCount === 0 ? result(s) : fail("INVALID_RESPONSE");
  if (c.action !== "close" && c.expectedTurn !== s.state.turnCount)
    return fail("INVALID_RESPONSE");
  const activityCommand = ["pause", "resume", "engaged"].includes(c.action);
  if (s.state.hungUp || s.state.nextStepEarned) {
    // Exact committed receipts have already replayed above. A new logical
    // turn cannot be accepted after any terminal session outcome.
    if (c.action === "turn")
      return { ...fail("SESSION_CLOSED"), retryable: false };
    return activityCommand || c.action === "tick"
      ? fail("INVALID_RESPONSE")
      : result(s);
  }
  if (activityCommand) {
    if (!Number.isSafeInteger(c.activitySequence) || c.activitySequence! < 1)
      return fail("INVALID_RESPONSE");
    if (c.activitySequence! < s.activity.sequence)
      return fail("INVALID_RESPONSE");
    if (c.activitySequence === s.activity.sequence) {
      return c.action === s.activity.mode ? result(s) : fail("INVALID_RESPONSE");
    }
  }
  if (c.action === "tick" && c.activitySequence !== s.activity.sequence)
    return fail("INVALID_RESPONSE");
  // A client cannot start model work while its pause is unacknowledged.
  // Zero is the server-created paused initial state, retained for local callers.
  if (
    c.action === "turn" &&
    ((c.activitySequence ?? 0) !== s.activity.sequence ||
      s.activity.mode !== "pause")
  )
    return fail("INVALID_RESPONSE");
  const doc = structuredClone(s);
  const active =
    s.activeMs +
    (s.activity.checkpointAt === null
      ? 0
      : Math.max(0, now() - s.activity.checkpointAt));
  if (c.action !== "turn") {
    if (s.pending && c.action !== "close") return fail("NETWORK_ERROR"); // UI retries activity after the logical turn settles.
    if (c.action === "pause") {
      // Conservatively discard the uncheckpointed tail: it may be lost-pause
      // delivery/ack wait time. Heartbeat checkpoints retain confirmed active time.
      doc.readyAt = null;
      doc.activity = {
        sequence: c.activitySequence!,
        mode: "pause",
        checkpointAt: null,
      };
    } else if (c.action === "resume" || c.action === "engaged") {
      if (doc.readyAt === null || doc.engaged !== (c.action === "engaged")) {
        doc.activeMs = active;
        doc.readyAt = now();
      }
      doc.engaged = c.action === "engaged";
      doc.activeMs = active;
      doc.activity = {
        sequence: c.activitySequence!,
        mode: c.action,
        checkpointAt: now(),
      };
    } else if (
      c.action === "close" ||
      (c.action === "tick" &&
        s.readyAt !== null &&
        (active >= config.limits.hardDurationMs ||
          (!s.engaged && now() - s.readyAt >= config.limits.inactivityMs)))
    ) {
      doc.state = {
        ...s.state,
        state: config.hungUpState,
        hungUp: true,
        elapsedMs: Math.min(active, config.limits.hardDurationMs),
      };
      doc.readyAt = null;
      doc.activity = {
        sequence: s.activity.sequence,
        mode: "closed",
        checkpointAt: null,
      };
      doc.history.push({
        role: "assistant",
        content: config.closeLines.activityTimeout,
      });
    } else if (c.action === "tick" && s.readyAt !== null) {
      doc.activeMs = active;
      doc.activity.checkpointAt = now();
    } else return result(s);
    return (await store.cas(row, doc)) ? result(doc) : fail("NETWORK_ERROR");
  }
  if (
    !s.pending &&
    s.readyAt !== null &&
    (active >= config.limits.hardDurationMs ||
      (!s.engaged && now() - s.readyAt >= config.limits.inactivityMs))
  ) {
    doc.state = {
      ...s.state,
      state: config.hungUpState,
      hungUp: true,
      elapsedMs: Math.min(active, config.limits.hardDurationMs),
    };
    doc.readyAt = null;
    doc.history.push({
      role: "assistant",
      content: config.closeLines.turnTimeout,
    });
    return (await store.cas(row, doc)) ? result(doc) : fail("NETWORK_ERROR");
  }
  if (!c.input.trim()) return fail("INVALID_RESPONSE");
  if (s.pending && (s.pending.turnId !== c.turnId || s.pending.input !== c.input))
    return fail("INVALID_RESPONSE");
  // Reserve the logical turn before contacting the provider; freezes excluded service/retry time.
  doc.pending = s.pending ?? {
    turnId: c.turnId,
    input: c.input,
    elapsed: active,
  };
  doc.readyAt = null;
  if (!(await store.cas(row, doc))) return fail("NETWORK_ERROR");
  const reserved: Row = { ...row, version: row.version + 1, document: doc };
  try {
    const proposal = parseProposal(await model.evaluate(c.input, doc), config);
    const after = reduce(
      doc.state,
      proposal,
      c.input,
      doc.history[doc.history.length - 1]?.content ?? "",
      doc.pending.elapsed,
      config,
    );
    const text = await model.render(c.input, doc, after);
    if (typeof text !== "string" || !text.trim() || text.length > 500)
      throw new Error("INVALID_RESPONSE");
    const finished = structuredClone(doc);
    finished.state = after;
    if (after.hungUp || after.nextStepEarned)
      finished.activity = {
        sequence: doc.activity.sequence,
        mode: "closed",
        checkpointAt: null,
      };
    finished.activeMs = after.elapsedMs;
    finished.pending = null; // Resume is explicit after TTS.
    finished.history.push(
      { role: "user", content: c.input },
      { role: "assistant", content: text },
    );
    const out = result(finished);
    finished.receipts[c.turnId] = {
      input: c.input,
      result: out,
      reason: proposal.reason,
    };
    if (await store.cas(reserved, finished)) return out;
    const winner = await store.get(c.sessionId);
    const cached =
      winner?.owner === c.owner
        ? winner.document.receipts[c.turnId]
        : undefined;
    return cached?.input === c.input ? cached.result : fail("NETWORK_ERROR");
  } catch (e) {
    // Prospect state and transcript remain untouched. Pending input and frozen clock survive retry.
    if (e instanceof Error && e.name === "ProviderQuotaError")
      return { ...fail("MODEL_ERROR"), retryable: false };
    return fail(
      e instanceof Error && e.message === "INVALID_RESPONSE"
        ? "INVALID_RESPONSE"
        : e instanceof Error && e.name === "AbortError"
          ? "MODEL_TIMEOUT"
          : "MODEL_ERROR",
    );
  }
}

export type {
  ActivityAck,
  Command,
  Model,
  Result,
  Row,
  Snapshot,
  Store,
};
export type { ProspectState } from "./types.ts";
