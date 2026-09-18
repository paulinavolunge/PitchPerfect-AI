// Budget compatibility wrapper (Generalization Phase 1).
// The validated Budget contract is unchanged: every export below keeps its
// exact name, type shape and runtime behavior. Implementations delegate to
// the shared prospect engine with the immutable server-owned BUDGET_CONFIG.
import {
  BUDGET_BEHAVIORS,
  BUDGET_CONFIG,
  BUDGET_OPENING,
  BUDGET_PERSONA,
  BUDGET_STATES,
  BUDGET_TRANSITIONS,
} from "../prospect/scenarios/budget.ts";
import {
  allowed as allowedProspect,
  parseProposal as parseProposalProspect,
  reduce as reduceProspect,
  telemetry as telemetryProspect,
} from "../prospect/state.ts";
import type {
  ObjectionStatus as GenericObjectionStatus,
  Proposal as GenericProposal,
  ProspectState as GenericProspectState,
} from "../prospect/types.ts";

export const STATES = BUDGET_STATES;
export type State = (typeof STATES)[number];
export type ObjectionStatus = GenericObjectionStatus;
export interface ProspectState extends GenericProspectState {
  state: State;
}
export const OPENING = BUDGET_OPENING;
export const PERSONA = BUDGET_PERSONA;
export const BEHAVIORS = BUDGET_BEHAVIORS;
export type Behavior = (typeof BEHAVIORS)[number];
export interface Proposal extends GenericProposal {
  proposedState: State;
  evidence: { behavior: Behavior; quote: string; prospectQuote: string }[];
}
export function initialState(): ProspectState {
  return BUDGET_CONFIG.initialState() as ProspectState;
}
export const transitions: Record<State, readonly State[]> = BUDGET_TRANSITIONS;
export function allowed(from: State, to: State) {
  return allowedProspect(from, to, BUDGET_CONFIG.transitions);
}
export function parseProposal(raw: unknown): Proposal {
  return parseProposalProspect(raw, BUDGET_CONFIG) as Proposal;
}
export function reduce(
  before: ProspectState,
  raw: unknown,
  rep: string,
  prospect: string,
  elapsedMs: number,
): ProspectState {
  return reduceProspect(
    before,
    raw,
    rep,
    prospect,
    elapsedMs,
    BUDGET_CONFIG,
  ) as ProspectState;
}
export function telemetry(before: ProspectState, after: ProspectState) {
  return telemetryProspect(before, after);
}
