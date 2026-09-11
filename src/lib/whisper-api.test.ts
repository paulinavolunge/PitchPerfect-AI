import { beforeEach, describe, expect, it, vi } from 'vitest';
const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));
import { whisperTranscribe } from './whisper-api';
const audio = () => ({ size: 8, type: 'audio/webm;codecs=opus', arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }) as Blob;
describe('transcription failure diagnostics', () => {
  beforeEach(() => invoke.mockReset());
  it('returns a valid transcription', async () => {
    invoke.mockResolvedValue({ data: { text: 'A short pilot proposal.' }, error: null });
    expect(await whisperTranscribe(audio())).toBe('A short pilot proposal.');
  });
  it('retains HTTP classification without provider billing details', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'sensitive upstream detail', context: new Response('{}', { status: 429 }) } });
    await expect(whisperTranscribe(audio())).rejects.toMatchObject({ category: 'TRANSCRIPTION_PROVIDER_FAILURE', status: 429, message: 'Voice transcription failed. Please try again.' });
  });
  it('distinguishes request transport failure', async () => {
    invoke.mockResolvedValue({ error: { message: 'fetch failed' } });
    await expect(whisperTranscribe(audio())).rejects.toMatchObject({ category: 'TRANSCRIPTION_REQUEST_FAILURE', status: null });
  });
  it('rejects an empty transcription', async () => {
    invoke.mockResolvedValue({ data: { text: '' }, error: null });
    await expect(whisperTranscribe(audio())).rejects.toMatchObject({ category: 'INVALID_TRANSCRIPTION' });
  });
});
