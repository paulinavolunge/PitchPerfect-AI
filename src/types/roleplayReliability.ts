export type RoleplayFailureType =
  | 'MODEL_ERROR'
  | 'MODEL_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'TRANSCRIPTION_ERROR'
  | 'TTS_ERROR';

export interface RoleplayTurnSuccess {
  ok: true;
  requestId: string;
  sessionId: string;
  turnId: string;
  text: string;
  latencyMs: number;
  totalLatencyMs?: number;
}

export interface RoleplayTurnFailure {
  ok: false;
  requestId: string;
  sessionId: string;
  turnId: string;
  errorType: RoleplayFailureType;
  retryable: boolean;
  latencyMs: number;
  totalLatencyMs?: number;
}

export type RoleplayTurnResult = RoleplayTurnSuccess | RoleplayTurnFailure;

export const ROLEPLAY_MODEL_TIMEOUT_MS = 30_000;

export function isRoleplayAttemptCurrent(
  attemptId: string,
  activeAttemptId: string | null,
  resultSessionId: string,
  currentSessionId: string,
): boolean {
  return attemptId === activeAttemptId && resultSessionId === currentSessionId;
}

export function classifyRoleplayFailure(status?: number, timedOut = false): RoleplayFailureType {
  if (timedOut) return 'MODEL_TIMEOUT';
  if (status === undefined) return 'NETWORK_ERROR';
  if (status >= 500 || status === 429) return 'MODEL_ERROR';
  return 'INVALID_RESPONSE';
}
