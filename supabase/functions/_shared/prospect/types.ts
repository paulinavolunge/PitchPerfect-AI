// Scenario-neutral prospect-engine protocol types.
// Moved verbatim from the validated Budget implementation; state and
// behavior names are plain strings here and are narrowed per scenario by
// the scenario config and its compatibility wrapper.
import type { telemetry } from "./state.ts";

export type ObjectionStatus = "UNADDRESSED" | "ACKNOWLEDGED" | "RESOLVED";

export interface ProspectState {
  state: string;
  patience: number;
  interest: number;
  trust: number;
  relevance: number;
  objectionsResolved: string[];
  turnCount: number;
  elapsedMs: number;
  primaryObjectionStatus: ObjectionStatus;
  nextStepEarned: boolean;
  hungUp: boolean;
  poorTurns: number;
  ignoredTurns: number;
  meetingAsks: number;
}

export interface Proposal {
  text: string;
  proposedState: string;
  deltas: {
    patience: number;
    interest: number;
    trust: number;
    relevance: number;
  };
  objectionStatus: ObjectionStatus;
  hangUp: boolean;
  nextStepEarned: boolean;
  reason: string;
  evidence: { behavior: string; quote: string; prospectQuote: string }[];
}

export interface ActivityAck {
  sessionId: string;
  sequence: number;
  mode: "pause" | "resume" | "engaged" | "closed";
}

export interface Snapshot {
  activity: {
    sequence: number;
    mode: ActivityAck["mode"];
    checkpointAt: number | null;
  };
  state: ProspectState;
  history: { role: "user" | "assistant"; content: string }[];
  receipts: Record<string, { input: string; result: Result; reason?: string }>;
  readyAt: number | null;
  engaged: boolean;
  activeMs: number;
  pending: { turnId: string; input: string; elapsed: number } | null;
}

export interface Row {
  id: string;
  owner: string;
  version: number;
  document: Snapshot;
}

export interface Store {
  get(id: string): Promise<Row | null>;
  create(row: Row): Promise<boolean>;
  cas(row: Row, document: Snapshot): Promise<boolean>;
}

export interface Result {
  ok: boolean;
  sessionId: string;
  turnId: string;
  response?: string;
  prospectState?: ProspectState;
  version?: number;
  errorType?: string;
  retryable?: boolean;
  stateTelemetry?: ReturnType<typeof telemetry>;
  latencyMs: number;
  activityAck?: ActivityAck;
}

export interface Command {
  sessionId: string;
  turnId: string;
  owner: string;
  action: "start" | "turn" | "pause" | "resume" | "tick" | "close" | "engaged";
  activitySequence?: number;
  expectedTurn: number;
  input: string;
}

export interface Model {
  evaluate(rep: string, s: Snapshot): Promise<Proposal>;
  render(rep: string, s: Snapshot, after: ProspectState): Promise<string>;
}
