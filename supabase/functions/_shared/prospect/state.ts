// Scenario-neutral deterministic prospect machinery.
// The pipeline shape (terminal guard, proposal parsing, evidence anchoring,
// counters, policy deltas, objection rules, hang/earn gates, target
// selection, transition legality) is shared; every policy decision is driven
// by the supplied ScenarioConfig. Ported verbatim from the validated Budget
// implementation: only the policy inputs moved into config.
import type { ScenarioConfig } from "./config.ts";
import type {
  ObjectionStatus,
  Proposal,
  ProspectState,
} from "./types.ts";

export function parseProposal(raw: unknown, config: ScenarioConfig): Proposal {
  const p = raw as Proposal;
  if (
    !p ||
    typeof p !== "object" ||
    typeof p.text !== "string" ||
    !p.text.trim() ||
    p.text.length > 500 ||
    !config.states.includes(p.proposedState) ||
    !["UNADDRESSED", "ACKNOWLEDGED", "RESOLVED"].includes(p.objectionStatus) ||
    typeof p.hangUp !== "boolean" ||
    typeof p.nextStepEarned !== "boolean" ||
    typeof p.reason !== "string" ||
    p.reason.length > 240 ||
    !p.deltas ||
    !Array.isArray(p.evidence) ||
    p.evidence.length > 14
  )
    throw new Error("INVALID_RESPONSE");
  for (const k of ["patience", "interest", "trust", "relevance"] as const)
    if (!Number.isFinite(p.deltas[k])) throw new Error("INVALID_RESPONSE");
  for (const e of p.evidence)
    if (
      !e ||
      !config.behaviors.includes(e.behavior) ||
      typeof e.quote !== "string" ||
      !e.quote.trim() ||
      typeof e.prospectQuote !== "string"
    )
      throw new Error("INVALID_RESPONSE");
  return p;
}

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

function anchorEvidence(
  p: Proposal,
  rep: string,
  prospect: string,
  config: ScenarioConfig,
): Set<string> {
  return new Set(
    p.evidence
      .filter(
        (e) =>
          rep.includes(e.quote) &&
          (!config.contextualBehaviors.includes(e.behavior) ||
            (e.prospectQuote.trim().length > 3 &&
              prospect.includes(e.prospectQuote))),
      )
      .map((e) => e.behavior),
  );
}

export function allowed(
  from: string,
  to: string,
  transitions: Record<string, readonly string[]>,
): boolean {
  return from === to || (transitions[from] ?? []).includes(to);
}

export function reduce(
  before: ProspectState,
  raw: unknown,
  rep: string,
  prospect: string,
  elapsedMs: number,
  config: ScenarioConfig,
): ProspectState {
  if (before.hungUp || before.nextStepEarned) return structuredClone(before);
  const p = parseProposal(raw, config);
  const b = anchorEvidence(p, rep, prospect, config);
  if (rep.trim().split(/\s+/).length > 90) b.add("rambling");
  const next = structuredClone(before);
  next.turnCount++;
  next.elapsedMs = Math.max(
    before.elapsedMs,
    Math.min(config.limits.hardDurationMs, elapsedMs),
  );
  if (config.askBehaviors.some((x) => b.has(x))) next.meetingAsks++;
  if (b.has(config.ignoringBehavior)) next.ignoredTurns++;
  const repeatedAsk =
    next.meetingAsks > 1 && config.askBehaviors.some((x) => b.has(x));
  const bad = config.poorBehaviors.some((x) => b.has(x)) || repeatedAsk;
  if (bad) next.poorTurns++;
  // Positive ceilings require contextual semantic evidence; proposed deltas never directly own state.
  const caps = config.deltaPolicy(b, bad);
  // Evidence selects fixed bounded deltas. Model numbers are validated but cannot override policy.
  for (const [key, cap] of Object.entries(caps)) {
    const k = key as keyof Proposal["deltas"];
    const delta = clamp(cap, -100, 15);
    next[k] = clamp(before[k] + delta);
  }
  if (!bad && b.has(config.objectionHandlingBehavior)) {
    next.primaryObjectionStatus = config.objectionPolicy(
      before.primaryObjectionStatus,
      p.objectionStatus,
    );
  }
  next.objectionsResolved = config.resolvedObjectionIds(
    next.primaryObjectionStatus,
  );
  const earned = config.nextStepGate({
    turnCount: next.turnCount,
    trust: next.trust,
    relevance: next.relevance,
    interest: next.interest,
    primaryObjectionStatus: next.primaryObjectionStatus,
    behaviors: b,
    bad,
  });
  const hang = config.hangRule({ next, before, behaviors: b, earned });
  let target: string = config.selectTarget({
    hang,
    earned,
    before,
    next,
    bad,
    behaviors: b,
  });
  if (
    !hang &&
    !earned &&
    (next.patience < config.softLimit.patienceBelow ||
      next.elapsedMs >= config.softLimit.elapsedMsAtLeast)
  )
    target = config.softLimit.target;
  if (!allowed(before.state, target, config.transitions)) target = before.state;
  next.state = target;
  next.hungUp = target === config.hungUpState;
  next.nextStepEarned = target === config.nextStepState;
  return next;
}

export function telemetry(before: ProspectState, after: ProspectState) {
  return {
    state_before: before.state,
    state_after: after.state,
    patience_before: before.patience,
    patience_after: after.patience,
    interest_before: before.interest,
    interest_after: after.interest,
    trust_before: before.trust,
    trust_after: after.trust,
    relevance_before: before.relevance,
    relevance_after: after.relevance,
    hang_up: after.hungUp,
    next_step_earned: after.nextStepEarned,
    turn_count: after.turnCount,
  };
}

export type { ObjectionStatus };
