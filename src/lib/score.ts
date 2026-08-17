/**
 * The canonical score scale across the app is 0-100 ("percent"). Any producer
 * that hands a score to a display, storage, or comparison site must already
 * be on that scale — `toPercent` does NOT auto-detect or upscale 0-10 inputs.
 * The auto-detect it replaces (`n <= 10 ? n * 10 : n`) previously hid two
 * different rendering bugs where a 0-100 debrief score got multiplied again,
 * so keeping this helper strict is intentional.
 */
export function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}
