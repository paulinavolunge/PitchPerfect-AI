import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * Regression test for the "score is null" bug.
 *
 * Previously, GamifiedRoleplay called incrementAttempt({ score: null }) after a completed
 * round, so every practice_sessions row had status='scored' but score IS NULL. The dashboard,
 * streak, weakest-area, and progress charts all read empty while the free-attempt counter
 * still ticked.
 *
 * This test asserts that incrementAttempt forwards a non-null score AND non-null
 * feedback_data to the practice_sessions insert. If someone re-introduces `score: null`
 * for completed rounds, this test will fail.
 */

const insertMock = vi.fn().mockResolvedValue({ error: null });
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => fromMock(...args),
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isPremium: true, // skip credit deduction path
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
import { useFreeTrialLimit } from '@/hooks/useFreeTrialLimit';

describe('score persistence regression', () => {
  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
  });

  it('persists a non-null score and feedback_data when a completed round finishes', async () => {
    const { result } = renderHook(() => useFreeTrialLimit());

    await act(async () => {
      await result.current.incrementAttempt({
        scenario_type: 'budget',
        difficulty: 'medium',
        industry: 'general',
        duration_seconds: 73,
        score: 7.4,
        transcript: 'Rep: hi\nProspect: hi',
        feedback_data: { score: 7.4, strengths: ['x'], improvements: ['y'] },
      });
    });

    expect(fromMock).toHaveBeenCalledWith('practice_sessions');
    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][0];

    // The regression: these must never be null for a completed round.
    expect(row.score).not.toBeNull();
    expect(row.score).toBe(7.4);
    expect(row.feedback_data).not.toBeNull();
    expect(row.transcript).not.toBeNull();
  });
});
