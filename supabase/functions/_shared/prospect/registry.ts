// Server-owned scenario registry.
// Only scenarios listed here can run through the shared prospect engine.
// Unknown IDs fail closed. The public homepage Cold Call flow is separate
// and is not part of this registry. Generalization Phase 1 registers Budget
// only; the other five objection scenarios are not migrated here.
import { BUDGET_CONFIG } from "./scenarios/budget.ts";
import type { ScenarioConfig } from "./config.ts";

const REGISTRY = {
  budget: BUDGET_CONFIG,
} as const;

export type RegisteredScenarioId = keyof typeof REGISTRY;

export const SCENARIO_IDS: readonly RegisteredScenarioId[] =
  Object.keys(REGISTRY) as RegisteredScenarioId[];

export function getScenarioConfig(scenarioId: unknown): ScenarioConfig {
  if (
    typeof scenarioId !== "string" ||
    !Object.prototype.hasOwnProperty.call(REGISTRY, scenarioId)
  )
    throw new Error("UNKNOWN_SCENARIO");
  return REGISTRY[scenarioId as RegisteredScenarioId];
}
