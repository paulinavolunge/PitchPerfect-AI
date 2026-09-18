// Server-owned scenario configuration contract.
// The shared engine owns the protocol, validation machinery and reducer
// pipeline shape; every scenario-specific policy decision lives in the
// ScenarioConfig implementation. Unknown scenario IDs fail closed in the
// registry; only scenarios listed there can run.
import type {
  ObjectionStatus,
  ProspectState,
  Snapshot,
} from "./types.ts";

export interface MetricDeltas {
  patience: number;
  interest: number;
  trust: number;
  relevance: number;
}

export interface NextStepContext {
  turnCount: number;
  trust: number;
  relevance: number;
  interest: number;
  primaryObjectionStatus: ObjectionStatus;
  behaviors: ReadonlySet<string>;
  bad: boolean;
}

export interface HangContext {
  next: ProspectState;
  before: ProspectState;
  behaviors: ReadonlySet<string>;
  earned: boolean;
}

export interface TargetContext {
  hang: boolean;
  earned: boolean;
  before: ProspectState;
  next: ProspectState;
  bad: boolean;
  behaviors: ReadonlySet<string>;
}

export interface ScenarioConfig {
  readonly scenarioId: string;
  readonly displayLabel: string;
  /** Service-only session table this scenario persists to. */
  readonly table: string;
  readonly states: readonly string[];
  readonly transitions: Record<string, readonly string[]>;
  readonly hungUpState: string;
  readonly nextStepState: string;
  readonly behaviors: readonly string[];
  /** Behaviors whose evidence additionally requires an anchored buyer quote. */
  readonly contextualBehaviors: readonly string[];
  /** Behaviors that mark a turn poor (plus repeated asks, owned by engine). */
  readonly poorBehaviors: readonly string[];
  /** Behaviors counted as meeting/next-step asks. */
  readonly askBehaviors: readonly string[];
  readonly ignoringBehavior: string;
  readonly aggressionBehavior: string;
  readonly pushingBehavior: string;
  readonly objectionHandlingBehavior: string;
  readonly appropriateAskBehavior: string;
  readonly opening: string;
  readonly personaPrompt: string;
  /** Exact closing lines: activity-timeout vs turn-arrival-timeout. */
  readonly closeLines: {
    readonly activityTimeout: string;
    readonly turnTimeout: string;
  };
  readonly limits: {
    readonly hardDurationMs: number;
    readonly inactivityMs: number;
  };
  readonly softLimit: {
    readonly patienceBelow: number;
    readonly elapsedMsAtLeast: number;
    readonly target: string;
  };
  readonly outputSchemaName: string;
  readonly model: {
    readonly name: string;
    readonly temperature: number;
    readonly maxTokens: number;
  };
  initialState(): ProspectState;
  /**
   * Fixed bounded metric caps selected by anchored evidence. The engine
   * clamps each cap to [-100, 15] and the resulting metric to [0, 100];
   * policy numbers can never directly own state.
   */
  deltaPolicy(behaviors: ReadonlySet<string>, bad: boolean): MetricDeltas;
  /**
   * Called only for a non-poor turn carrying objection-handling evidence.
   * First acknowledgement cannot instantly resolve.
   */
  objectionPolicy(
    before: ObjectionStatus,
    proposed: ObjectionStatus,
  ): ObjectionStatus;
  resolvedObjectionIds(status: ObjectionStatus): string[];
  nextStepGate(ctx: NextStepContext): boolean;
  hangRule(ctx: HangContext): boolean;
  selectTarget(ctx: TargetContext): string;
  evaluatePrompt(s: Snapshot): string;
  renderPrompt(after: ProspectState): string;
}
