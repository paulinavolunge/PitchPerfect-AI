import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ElevenLabs voice IDs
export const VOICE_FEMALE = '21m00Tcm4TlvDq8ikWAM'; // Rachel — warm, professional female
export const VOICE_MALE = 'nPczCjzI2devNBz1zQrb';   // Brian — deeper, gruffer male
const DEFAULT_VOICE_ID = VOICE_FEMALE;

/** How long to wait for the ElevenLabs edge function before giving up. */
const TTS_TIMEOUT_MS = 15_000;
/** Minimum gap between backup-voice notices so we never spam the user. */
const VOICE_NOTICE_COOLDOWN_MS = 5 * 60 * 1000;

/** Result of fetching TTS audio: playable URL, backup-voice fallback, or dropped (stale/muted). */
type FetchResult =
  | { kind: 'audio'; url: string }
  | { kind: 'fallback' }
  | { kind: 'dropped' };

/**
 * Hook that speaks prospect responses via ElevenLabs TTS,
 * with automatic fallback to browser SpeechSynthesis.
 *
 * Non-blocking: returns immediately, plays audio when ready.
 *
 * Fetches start immediately and run concurrently (so sentence 2's audio is
 * already downloading while sentence 1 plays — no dead air between
 * sentences); only *playback* is serialized through the play queue.
 * stop() bumps an epoch that invalidates anything still queued, so a
 * hang-up or reset can never be followed by stale prospect speech.
 */
export function useProspectVoice() {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const playQueueRef = useRef<Promise<void>>(Promise.resolve());
  const epochRef = useRef(0);
  const isMutedRef = useRef(false);
  const lastBackupVoiceNoticeRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
  );

  /**
   * Calm, visible notice when we fall back to browser TTS — no more silent
   * degradation. Throttled so a flaky voice service can't spam toasts.
   */
  const notifyBackupVoice = useCallback((description: string) => {
    const now = Date.now();
    if (now - lastBackupVoiceNoticeRef.current < VOICE_NOTICE_COOLDOWN_MS) return;
    lastBackupVoiceNoticeRef.current = now;
    toast({ title: 'Using backup voice', description });
  }, []);

  /** Fully release the current Audio element and its object URL */
  const releaseAudio = useCallback(() => {
    const audio = currentAudioRef.current;
    const url = currentUrlRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      // Remove src so the browser releases the media resource
      audio.removeAttribute('src');
      audio.load(); // forces release of the media resource
      currentAudioRef.current = null;
    }
    if (url) {
      URL.revokeObjectURL(url);
      currentUrlRef.current = null;
    }
  }, []);

  /** Release audio resources without invalidating the queue (internal use). */
  const stopNow = useCallback(() => {
    releaseAudio();
    // Stop browser TTS
    synthRef.current?.cancel();
  }, [releaseAudio]);

  const stop = useCallback(() => {
    // Invalidate anything still queued — a hang-up, reset, or new turn must
    // never be followed by stale prospect speech.
    epochRef.current += 1;
    stopNow();
  }, [stopNow]);

  /**
   * Speak via browser SpeechSynthesis (backup voice). Returns a promise that
   * resolves when the utterance finishes, so the play queue serializes
   * consecutive fallback lines instead of cutting them off. Resolves
   * promptly if stop()/mute() invalidates the epoch mid-utterance.
   */
  const _speakFallback = useCallback((text: string, voiceId: string | undefined, epoch: number): Promise<void> => {
    const synth = synthRef.current;
    if (!synth) return Promise.resolve();
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) { done = true; clearInterval(watch); resolve(); }
      };
      // If stop()/mute() fires mid-utterance, don't leave the queue
      // hanging on a cancelled utterance in browsers that don't fire onend.
      const watch = setInterval(() => {
        if (epoch !== epochRef.current || isMutedRef.current) finish();
      }, 200);
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.95;

      const voices = synth.getVoices();
      const isMaleVoice = voiceId === VOICE_MALE;

      // Match gender to the prospect's ElevenLabs voice
      const preferred = isMaleVoice
        ? ['daniel', 'david', 'james', 'google uk english male', 'male']
        : ['samantha', 'google us english female', 'microsoft zira', 'female'];

      for (const pref of preferred) {
        const match = voices.find(v => v.name.toLowerCase().includes(pref));
        if (match) { utterance.voice = match; break; }
      }
      if (!utterance.voice) {
        const en = voices.find(v => v.lang.startsWith('en'));
        if (en) utterance.voice = en;
      }

      utterance.onend = finish;
      utterance.onerror = finish;
      // Safety timeout — don't block the queue forever
      setTimeout(finish, 15000);
      synth.speak(utterance);
    });
  }, []);

  /**
   * Fetch TTS audio for a chunk of text. Starts immediately and runs
   * concurrently with any current playback — the caller serializes only
   * the playback step, so the next sentence's audio is already downloaded
   * while the current one plays (no dead air between sentences).
   * Returns {kind:'audio',url}, {kind:'fallback'} (use browser TTS), or
   * {kind:'dropped'} when the request went stale (stop/mute) mid-flight.
   */
  const _fetchAudio = useCallback(async (text: string, voiceId: string | undefined, epoch: number): Promise<FetchResult> => {
    // Skip entirely while muted (mic is recording) or already stale
    if (isMutedRef.current || epoch !== epochRef.current) {
      return { kind: 'dropped' };
    }

    const vid = voiceId || DEFAULT_VOICE_ID;
    console.log('[ProspectVoice] Fetching audio:', text.slice(0, 60) + '…', 'voiceId:', vid);

    try {
      // Call ElevenLabs edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggpodadyycvmmxifqwlp.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncG9kYWR5eWN2bW14aWZxd2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjczNjMsImV4cCI6MjA2MTYwMzM2M30.39iEiaWL6mvX9uMxdcKPE_f2-7FkOuTs6K32Z7NelkY';

      let authToken = supabaseAnonKey;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      } catch (_) {
        // Guest — use anon key
      }

      // Abort after TTS_TIMEOUT_MS: a hung call must never stall the voice
      // queue — the catch below falls back to browser TTS with a notice.
      const ttsController = new AbortController();
      const ttsTimeout = setTimeout(() => ttsController.abort(), TTS_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            text: text.slice(0, 500),
            voiceId: vid,
          }),
          signal: ttsController.signal,
        });
      } finally {
        clearTimeout(ttsTimeout);
      }

      if (epoch !== epochRef.current || isMutedRef.current) return { kind: 'dropped' };

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('[ProspectVoice] Edge function error:', response.status, errBody);
        throw new Error(`TTS edge function error: ${response.status}`);
      }

      // Edge function streams raw MP3 bytes back with Content-Type audio/mpeg.
      // Build the Blob straight from the arrayBuffer — no re-encoding, no
      // AudioContext, no resampling — so the audio ElevenLabs produced is
      // what the user hears.
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer.byteLength) {
        throw new Error('Empty TTS response body');
      }
      console.log('[ProspectVoice] Audio received, bytes:', arrayBuffer.byteLength);

      if (epoch !== epochRef.current || isMutedRef.current) return { kind: 'dropped' };

      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      return { kind: 'audio', url: URL.createObjectURL(audioBlob) };
    } catch (err) {
      if (epoch !== epochRef.current || isMutedRef.current) return { kind: 'dropped' };
      const wasTimeout = err instanceof DOMException && err.name === 'AbortError';
      console.warn('[ProspectVoice] ElevenLabs failed, falling back to browser TTS:', err);
      notifyBackupVoice(
        wasTimeout
          ? 'The voice service was slow — using the backup voice for now.'
          : 'The voice service was unavailable — using the backup voice for now.'
      );
      return { kind: 'fallback' };
    }
  }, [notifyBackupVoice]);

  /**
   * Play a fetched audio URL, waiting until it finishes. Runs inside the
   * serialized play queue so prospect lines never overlap. Audio playback
   * failures fall back to the backup voice (awaited, so the queue stays
   * in order).
   */
  const _playAndWait = useCallback(async (url: string, text: string, voiceId: string | undefined, epoch: number): Promise<void> => {
    if (epoch !== epochRef.current || isMutedRef.current) {
      URL.revokeObjectURL(url);
      return;
    }
    stopNow(); // release any stale audio without invalidating the queue

    const audio = new Audio(url);
    currentAudioRef.current = audio;
    currentUrlRef.current = url;

    let playbackOk = true;
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => { if (!settled) { settled = true; playbackOk = ok; resolve(); } };
      audio.onended = () => {
        console.log('[ProspectVoice] Playback ended naturally');
        releaseAudio();
        done(true);
      };
      const onPlaybackError = () => {
        console.warn('[ProspectVoice] Audio playback error');
        releaseAudio();
        done(false);
      };
      audio.onerror = onPlaybackError;
      audio.play().then(
        () => console.log('[ProspectVoice] Playback started'),
        () => {
          console.warn('[ProspectVoice] Audio play() rejected');
          onPlaybackError();
        },
      );
      // Safety timeout — don't block the queue forever
      setTimeout(() => {
        if (epoch !== epochRef.current) releaseAudio();
        done(true);
      }, 15000);
    });

    if (!playbackOk && epoch === epochRef.current && !isMutedRef.current) {
      notifyBackupVoice('Voice playback hit a snag — using the backup voice for now.');
      await _speakFallback(text, voiceId, epoch);
    }
  }, [stopNow, releaseAudio, notifyBackupVoice, _speakFallback]);

  /**
   * Queued speak — serializes PLAYBACK so prospect lines never overlap,
   * while the audio FETCH for each line starts immediately (concurrently).
   * Each line captures the current epoch: stop()/mute() invalidates queued
   * lines so stale speech can never play after a hang-up, reset, or new turn.
   */
  const speak = useCallback((text: string, voiceId?: string) => {
    if (!text.trim()) return;
    const epoch = epochRef.current;
    const fetched = _fetchAudio(text, voiceId, epoch);
    playQueueRef.current = playQueueRef.current
      .then(async () => {
        const result = await fetched;
        if (result.kind === 'dropped' || epoch !== epochRef.current || isMutedRef.current) {
          if (result.kind === 'audio') URL.revokeObjectURL(result.url);
          return;
        }
        if (result.kind === 'fallback') {
          await _speakFallback(text, voiceId, epoch);
          return;
        }
        await _playAndWait(result.url, text, voiceId, epoch);
      })
      .catch((err) => {
        console.warn('[ProspectVoice] Queue error:', err);
      });
  }, [_fetchAudio, _playAndWait, _speakFallback]);

  /** Mute TTS — stops current audio and blocks queued speaks from starting */
  const mute = useCallback(() => {
    isMutedRef.current = true;
    stop();
    console.log('[ProspectVoice] Muted');
  }, [stop]);

  /** Unmute TTS — allows queued speaks to resume */
  const unmute = useCallback(() => {
    isMutedRef.current = false;
    console.log('[ProspectVoice] Unmuted');
  }, []);

  return { speak, stop, mute, unmute };
}
