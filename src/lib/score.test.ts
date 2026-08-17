import { describe, expect, it } from 'vitest';
import { toPercent } from './score';

describe('toPercent', () => {
  it('clamps to [0, 100] and rounds', () => {
    expect(toPercent(-5)).toBe(0);
    expect(toPercent(0)).toBe(0);
    expect(toPercent(42.4)).toBe(42);
    expect(toPercent(42.6)).toBe(43);
    expect(toPercent(100)).toBe(100);
    expect(toPercent(150)).toBe(100);
  });

  it('coerces non-finite input to 0', () => {
    expect(toPercent(NaN)).toBe(0);
    expect(toPercent(Infinity)).toBe(100);
    expect(toPercent(-Infinity)).toBe(0);
  });

  // If this test ever fails because someone made toPercent auto-detect a
  // 0-10 input and upscale it, DO NOT "fix" the test — fix the caller that
  // is producing 0-10 values into a 0-100 pipeline. Auto-detect masked the
  // ColdCallHook / ScoreUnlock double-scaling bugs for months.
  it('does NOT auto-detect a 0-10 scale — a raw 1-10 value passes through', () => {
    expect(toPercent(1)).toBe(1);
    expect(toPercent(7)).toBe(7);
    expect(toPercent(8.5)).toBe(9);
    expect(toPercent(10)).toBe(10);
  });
});
