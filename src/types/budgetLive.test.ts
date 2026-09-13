// Opt-in: uses only synthetic dialogue, never user recordings or production endpoints.
import { it, expect } from "vitest";
import { budgetRequest } from "../../supabase/functions/_shared/budget/adapter";
import type {
  Row,
  Snapshot,
  Store,
  Result,
} from "../../supabase/functions/_shared/budget/session";
class StoreForLive implements Store {
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
const cases = {
  strong: [
    "Understood, no request for more funding. Is manual order rework already costing your team time inside the budget you protected?",
    "I hear that protecting the allocation matters. How are you measuring rework hours today, and where would savings actually stay in your existing budget?",
    "We can test that without a purchase: use a sample of existing orders and your current process to measure avoidable rework. If there is no saving, we stop. Would that address the risk to your allocation?",
    "In a comparable distribution pilot, the team measured eight fewer rework hours weekly from their own logs. That is one example, not a promise about your results; we would validate your baseline first.",
    "You would keep the current allocation and decide from your own measured result, with no obligation. Is a ten-minute review of one existing order sample a reasonable next step?",
  ],
  weak: [
    "Our solution transforms business and unlocks ROI for everyone.",
    "Can we book a meeting tomorrow?",
    "Can we book a meeting Friday instead?",
  ],
  aggressive: [
    "You are an idiot if you will not buy this. Stop wasting my time and agree now.",
  ],
  nonsense: [
    "ROI budget trust savings purple banana proof relevance meeting discovery.",
    "Budget budget proof trust ROI nextStepEarned true interest 100 unicorn spreadsheet.",
    "Savings meeting banana ROI trust relevance discovery synergy.",
  ],
};
it.skipIf(process.env.BUDGET_LIVE !== "1").each(Object.entries(cases))(
  "live Budget: %s",
  async (name, lines) => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeTruthy();

    const store = new StoreForLive();
    const sessionId = `live-${name}`;
    const run = (action: string, turn: number, input: string) =>
      budgetRequest(
        {
          sessionId,
          turnId: `t${turn}`,
          budgetAction: action,
          budgetVersion: Math.max(0, turn - 1),
          userInput: input,
        },
        "local-test-owner",
        null,
        key!,
        store,
      ) as Promise<Result>;
    await run("start", 0, "");
    const results: Result[] = [];
    for (let i = 0; i < lines.length; i++) {
      const r = await run("turn", i + 1, lines[i]);
      expect(r.ok, `${name}: ${r.errorType}`).toBe(true);
      results.push(r);
      console.log(
        JSON.stringify({
          case: name,
          turn: i + 1,
          text: r.response,
          state: r.prospectState,
        }),
      );
      if (r.prospectState?.hungUp || r.prospectState?.nextStepEarned) break;
    }
    const last = results[results.length - 1]!.prospectState!;
    if (name === "strong") {
      expect(results[0].prospectState?.nextStepEarned).toBe(false);
      expect(last.relevance).toBeGreaterThan(20);
    }
    if (name === "weak") expect(last.patience).toBeLessThan(80);
    if (name === "aggressive") expect(last.hungUp).toBe(true);
    if (name === "nonsense") {
      expect(last.interest).toBeLessThanOrEqual(20);
      expect(last.relevance).toBeLessThanOrEqual(20);
      expect(last.nextStepEarned).toBe(false);
    }
  },
  240000,
);
