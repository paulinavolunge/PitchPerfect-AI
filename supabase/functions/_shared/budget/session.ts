// Budget compatibility wrapper (Generalization Phase 1).
// The validated Budget session contract is unchanged. handleBudget delegates
// to the shared prospect engine with the immutable server-owned
// BUDGET_CONFIG; all protocol types are re-exported unchanged.
import { BUDGET_CONFIG } from "../prospect/scenarios/budget.ts";
import { handleProspect } from "../prospect/session.ts";
import type {
  ActivityAck,
  Command,
  Model,
  Result,
  Row,
  Snapshot,
  Store,
} from "../prospect/types.ts";

export type {
  ActivityAck,
  Command,
  Model,
  Result,
  Row,
  Snapshot,
  Store,
};

export function handleBudget(
  c: Command,
  store: Store,
  model: Model,
  now = () => Date.now(),
): Promise<Result> {
  return handleProspect(c, store, model, BUDGET_CONFIG, now);
}
