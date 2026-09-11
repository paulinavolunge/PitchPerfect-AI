import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const incrementAttempt = vi.fn();
const trackEvent = vi.fn();
vi.mock('@/components/ScorePaywall', () => ({ default: ({ score }: { score: number }) => <div>Verified score: {score}</div> }));
const voiceMocks = vi.hoisted(() => ({ transcribe: vi.fn() }));
vi.mock('@/utils/voiceInput', () => ({
  processVoiceInput: voiceMocks.transcribe,
  VoiceRecordingManager: class {
    async startRecording() {}
    isCurrentlyRecording() { return true; }
    getRecordingDuration() { return 12000; }
    async stopRecording() { return new Blob(['test-audio'], { type: 'audio/webm;codecs=opus' }); }
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }, functions: { invoke: vi.fn() } },
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null, isPremium: false }) }));
vi.mock('@/hooks/useFreeTrialLimit', () => ({
  useFreeTrialLimit: () => ({ hasReachedLimit: false, incrementAttempt, isGuest: true, remainingAttempts: 1, refreshCount: vi.fn() }),
}));
vi.mock('@/hooks/useUpgradeTriggers', () => ({
  useUpgradeTriggers: () => ({ shouldShow: false, markShown: vi.fn(), markDismissed: vi.fn(), markConverted: vi.fn() }),
}));
vi.mock('@/hooks/useSoundEffects', () => ({
  useSoundEffects: () => ({ unlock: vi.fn(), playCallStart: vi.fn().mockResolvedValue(undefined), playCallEnd: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock('@/hooks/useProspectVoice', () => ({
  useProspectVoice: () => ({ speak: vi.fn(), stop: vi.fn(), mute: vi.fn(), unmute: vi.fn() }),
}));
vi.mock('@/utils/analytics', () => ({ trackEvent: (...args: unknown[]) => trackEvent(...args) }));
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import GamifiedRoleplay from './GamifiedRoleplay';

const preset = {
  objectionLabel: 'Reliability QA',
  openingLine: 'Hello, this is the opening request.',
  systemPrompt: 'Stay in character.',
  prospectName: 'Test Prospect',
  prospectTitle: 'VP',
};

function apiResult(body: object) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));
}

function success(turnId: string, text: string) {
  return { ok: true, requestId: crypto.randomUUID(), sessionId: '', turnId, response: text, latencyMs: 12 };
}

function failure(turnId: string, type = 'MODEL_ERROR') {
  return { ok: false, requestId: crypto.randomUUID(), sessionId: '', turnId, errorType: type, retryable: true, latencyMs: 15 };
}

async function renderOpened(coldCall = true) {
  vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    return apiResult({ ...success(payload.turnId, 'Opening prospect response.'), sessionId: payload.sessionId });
  });
  render(<GamifiedRoleplay autoStart presetScenario={preset} isColdCallHook={coldCall} alwaysSpeak />);
  await screen.findByText('Opening prospect response.');
}

describe('GamifiedRoleplay Phase 2A reliability', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } });
    voiceMocks.transcribe.mockReset();
    incrementAttempt.mockClear();
    trackEvent.mockClear();
  });

  it('keeps a failed turn uncounted, uncharged, ordered, and retryable with the same turn id', async () => {
    await renderOpened();
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...failure(payload.turnId), sessionId: payload.sessionId });
    });

    fireEvent.change(screen.getByPlaceholderText('Type your response…'), { target: { value: 'Here is concrete value for your team.' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('This turn was not counted or scored.');

    expect(screen.getByText('Round 1')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getAllByText('Here is concrete value for your team.')).toHaveLength(1);
    expect(incrementAttempt).not.toHaveBeenCalled();

    const failedBody = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...success(payload.turnId, 'That is specific enough to discuss.'), sessionId: payload.sessionId });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    await screen.findByText('That is specific enough to discuss.');

    const retryBody = JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body));
    expect(retryBody.turnId).toBe(failedBody.turnId);
    expect(screen.getAllByText('Here is concrete value for your team.')).toHaveLength(1);
    expect(screen.getByText('Round 2')).toBeTruthy();
    expect(incrementAttempt).not.toHaveBeenCalled();
    const successEvent = trackEvent.mock.calls.find(call => call[0] === 'roleplay_turn_succeeded' && call[1].turn_id === failedBody.turnId);
    expect(successEvent?.[1]).toMatchObject({ success: true, error_type: null, retry_count: 1, model_latency_ms: 12, total_ai_response_latency_ms: expect.any(Number) });
    expect(successEvent?.[1].session_id).toBe(failureEventSession(trackEvent.mock.calls, failedBody.turnId));
  });

  it('does not create prospect dialogue when the opening request fails', async () => {
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...failure(payload.turnId, 'MODEL_TIMEOUT'), sessionId: payload.sessionId });
    });
    render(<GamifiedRoleplay autoStart presetScenario={preset} isColdCallHook />);

    await screen.findByText('This turn was not counted or scored.');
    expect(screen.queryByText('Opening prospect response.')).toBeNull();
    expect(screen.queryByText('Hello, this is the opening request.')).toBeNull();
    expect(screen.getByText('Round 0')).toBeTruthy();
  });

  it('keeps an upstream quota rejection recoverable without patience or accounting changes', async () => {
    await renderOpened(false);
    vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve(new Response('{}', { status: 429 })));
    fireEvent.change(screen.getByPlaceholderText('Type your response…'), { target: { value: 'Please consider a pilot next quarter.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('This turn was not counted or scored.');
    vi.useFakeTimers();
    try {
      await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('Round 1')).toBeTruthy();
      expect(screen.getAllByText('Please consider a pilot next quarter.')).toHaveLength(1);
      expect(incrementAttempt).not.toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('roleplay_turn_failed', expect.objectContaining({ error_type: 'MODEL_ERROR' }));
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy();
    } finally { vi.useRealTimers(); }
  });

  it('allows only one retry request while a retry is in flight', async () => {
    await renderOpened();
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...failure(payload.turnId), sessionId: payload.sessionId });
    });
    fireEvent.change(screen.getByPlaceholderText('Type your response…'), { target: { value: 'Retry this exact turn.' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('This turn was not counted or scored.');

    let resolveRetry!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveRetry = resolve; }));
    const retry = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(retry);
    fireEvent.click(retry);
    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3));

    const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body));
    await act(async () => resolveRetry(await apiResult({ ...failure(payload.turnId), sessionId: payload.sessionId })));
    await waitFor(() => expect(screen.getByText('This turn was not counted or scored.')).toBeTruthy());
    expect(screen.getAllByText('Retry this exact turn.')).toHaveLength(1);
  });

  it('ends an unresolved failed turn as an explicitly unscored session', async () => {
    await renderOpened();
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...failure(payload.turnId), sessionId: payload.sessionId });
    });
    fireEvent.change(screen.getByPlaceholderText('Type your response…'), { target: { value: 'A failed response.' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('This turn was not counted or scored.');
    fireEvent.click(screen.getAllByRole('button', { name: 'End Session' }).at(-1)!);

    await screen.findByText(/couldn't score this one/i);
    expect(screen.getByText(/weren't charged a practice credit/i)).toBeTruthy();
    expect(incrementAttempt).not.toHaveBeenCalled();
    expect(screen.queryByText(/Session Score/i)).toBeNull();
  });

  it('emits complete success and failure telemetry with stable logical ids', async () => {
    await renderOpened();
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...failure(payload.turnId), sessionId: payload.sessionId });
    });
    fireEvent.change(screen.getByPlaceholderText('Type your response…'), { target: { value: 'Telemetry turn.' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('This turn was not counted or scored.');

    const failureEvent = trackEvent.mock.calls.find(call => call[0] === 'roleplay_turn_failed');
    expect(failureEvent?.[1]).toMatchObject({ scenario: 'Reliability QA', input_mode: 'text', success: false, error_type: 'MODEL_ERROR', retry_count: 0, model_latency_ms: 15, total_ai_response_latency_ms: expect.any(Number) });
    expect(failureEvent?.[1].session_id).toBeTruthy();
    expect(failureEvent?.[1].turn_id).toBeTruthy();
  });

  it('pauses patience during recording, transcription and persistent voice failure; allows recovery', async () => {
    await renderOpened();
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Start voice recording' }));
      await act(async () => { await vi.advanceTimersByTimeAsync(250); });
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
      expect(screen.getByText('100%')).toBeTruthy();
      let reject!: (reason: Error) => void;
      voiceMocks.transcribe.mockImplementationOnce(() => new Promise((_resolve, rej) => { reject = rej; }));
      fireEvent.click(screen.getByRole('button', { name: /Stop & Send/i }));
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
      expect(screen.getByText('100%')).toBeTruthy();
      await act(async () => { reject(new Error('provider unavailable')); });
      expect(screen.getByText(/We couldn’t transcribe/)).toBeTruthy();
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
      expect(screen.getByText('100%')).toBeTruthy();
      expect(screen.getByText('Round 1')).toBeTruthy();
      expect(incrementAttempt).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Record Again' }));
      await act(async () => { await vi.advanceTimersByTimeAsync(250); });
      expect(screen.getByRole('button', { name: 'Stop recording' })).toBeTruthy();
      voiceMocks.transcribe.mockResolvedValueOnce({ transcript: 'A concrete pilot for your team.', rawTranscript: 'A concrete pilot for your team.' });
      vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
        const payload = JSON.parse(String(init?.body));
        return apiResult({ ...success(payload.turnId, 'Tell me more about the pilot.'), sessionId: payload.sessionId });
      });
      fireEvent.click(screen.getByRole('button', { name: /Stop & Send/i }));
      await act(async () => { await vi.advanceTimersByTimeAsync(10); });
      expect(screen.getAllByText('A concrete pilot for your team.')).toHaveLength(1);
      expect(screen.getByText('Tell me more about the pilot.')).toBeTruthy();
      expect(screen.getByText('Round 2')).toBeTruthy();
      expect(trackEvent).toHaveBeenCalledWith('roleplay_transcription', expect.objectContaining({ success: true, recorded_mime_type: 'audio/webm;codecs=opus', recording_duration_ms: 12000, transcription_latency_ms: expect.any(Number) }));
    } finally { vi.useRealTimers(); }
  });

  it.each([
    ['Budget', "This is Renee. I'll be straight with you"],
    ['Think About It', 'Devon speaking.'],
    ['Send Me an Email', 'This is Keisha.'],
    ['Using a Competitor', 'This is Sofia.'],
    ['Bad Timing', 'Marcus Webb.'],
    ['Loop in Team', 'Andre here.'],
  ])('opens %s with its scripted first prospect message', async (scenario, opening) => {
    render(<GamifiedRoleplay />);
    fireEvent.click(screen.getByText(scenario));
    expect(screen.getByText('How do you want to respond?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Start Roleplay/i }));
    await screen.findByText((text) => text.startsWith(opening));
    expect(screen.getByText('Round 1')).toBeTruthy();
    expect(screen.getByPlaceholderText('Type your response…')).toBeTruthy();
    vi.mocked(fetch).mockImplementationOnce(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return apiResult({ ...success(payload.turnId, 'Let us discuss the business case.'), sessionId: payload.sessionId });
    });
    fireEvent.change(screen.getByPlaceholderText('Type your response…'), { target: { value: 'Could we review the cost of the current process?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Let us discuss the business case.');
    expect(screen.getByText('Round 2')).toBeTruthy();
    vi.mocked(fetch).mockImplementationOnce(() => apiResult({ analysis: { overallScore: 60, strengths: ['Clear question'], improvements: ['More detail'], recommendation: 'Keep practicing' } }));
    fireEvent.click(screen.getByRole('button', { name: 'End Session' }));
    await screen.findByText('Verified score: 60');
    expect(incrementAttempt).toHaveBeenCalledWith(expect.objectContaining({ score: 60, feedback_data: expect.any(Object) }));
  });
});

function failureEventSession(calls: unknown[][], turnId: string) {
  const call = calls.find(entry => entry[0] === 'roleplay_turn_failed' && (entry[1] as Record<string, unknown>).turn_id === turnId);
  return (call?.[1] as Record<string, unknown> | undefined)?.session_id;
}
