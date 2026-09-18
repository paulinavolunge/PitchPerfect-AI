// Budget compatibility wrapper (Generalization Phase 1).
// The external budgetRequest contract is unchanged. It now runs through the
// shared prospect adapter with the validated scenarioId "budget", which
// resolves the immutable server-owned BUDGET_CONFIG (fail-closed on unknown
// scenarios) and the Budget service-role store.
import {
  prospectDatabaseStore,
  prospectRequest,
} from "../prospect/adapter.ts";
import { BUDGET_CONFIG } from "../prospect/scenarios/budget.ts";
import type { Store } from "../prospect/types.ts";

export function databaseStore(db: any): Store {
  return prospectDatabaseStore(db, BUDGET_CONFIG.table);
}

export async function budgetRequest(
  body: any,
  owner: string,
  db: any,
  key: string,
  storeOverride?: Store,
): Promise<unknown> {
  return prospectRequest({
    body,
    owner,
    db,
    key,
    scenarioId: BUDGET_CONFIG.scenarioId,
    storeOverride,
  });
}
