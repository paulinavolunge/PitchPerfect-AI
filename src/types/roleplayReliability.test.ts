import { describe, expect, it } from 'vitest';
import { classifyRoleplayFailure, isRoleplayAttemptCurrent } from './roleplayReliability';

describe('roleplay reliability contract', () => {
  it('classifies timeout separately', () => expect(classifyRoleplayFailure(undefined, true)).toBe('MODEL_TIMEOUT'));
  it('classifies network failures without an HTTP status', () => expect(classifyRoleplayFailure()).toBe('NETWORK_ERROR'));
  it('marks transient server failures as model errors', () => expect(classifyRoleplayFailure(503)).toBe('MODEL_ERROR'));
  it('marks malformed client responses as invalid', () => expect(classifyRoleplayFailure(400)).toBe('INVALID_RESPONSE'));
  it('accepts only the active attempt in the current session', () => {
    expect(isRoleplayAttemptCurrent('attempt-1', 'attempt-1', 'session-1', 'session-1')).toBe(true);
    expect(isRoleplayAttemptCurrent('attempt-1', 'attempt-2', 'session-1', 'session-1')).toBe(false);
    expect(isRoleplayAttemptCurrent('attempt-1', 'attempt-1', 'session-old', 'session-new')).toBe(false);
  });
});
