import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ElevenLabs voice IDs
export const VOICE_FEMALE = '21m00Tcm4TlvDq8ikWAM'; // Rachel — warm, professional female
export const VOICE_MALE = 'nPczCjzI2devNBz1zQrb';   // Brian — deeper, gruffer male
const DEFAULT_VOICE_ID = VOICE_FEMALE;

/**
 * Hook that speaks prospect responses via ElevenLabs TTS,
 * with automatic fallback to browser SpeechSynthesis.
 *
 * Non-blocking: returns immediately, plays audio when ready.
 */
export function useProspectVoice() {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const epochRef = useRef(0);
  const noticeAtRef = useRef<number | null>(null);
  const notifyBackup = useCallback(() => {
    const now = Date.now();
    if (noticeAtRef.current !== null && now - noticeAtRef.current < 300000) return;
    noticeAtRef.current = now;
    toast({title:'Using backup voice', description:'The voice service was unavailable. Using the browser voice for now.'});
  }, []);
  const isMutedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
  );

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

  const playbackDoneRef = useRef<Promise<void>>(Promise.resolve());
  const finishPlaybackRef = useRef<(() => void) | null>(null);
  const fallbackDoneRef = useRef<(() => void) | null>(null);
  const stopPlayback = useCallback(() => {
    finishPlaybackRef.current?.();
    finishPlaybackRef.current=null;
    releaseAudio();
    // Stop browser TTS
    synthRef.current?.cancel();
    fallbackDoneRef.current?.();
    fallbackDoneRef.current=null;
  }, [releaseAudio]);
  const stop = useCallback(() => {
    epochRef.current++;
    stopPlayback();
    queueRef.current = Promise.resolve();
  }, [stopPlayback]);

  const fallbackToWebSpeech = useCallback((text: string, voiceId?: string) => {
    const synth = synthRef.current;
    if (!synth) return;
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

    return new Promise<void>(resolve => {
      fallbackDoneRef.current=resolve;
      utterance.onend=()=>{fallbackDoneRef.current=null;resolve();};
      utterance.onerror=()=>{fallbackDoneRef.current=null;resolve();};
      synth.speak(utterance);
    });
  }, []);

  const _speakImmediate = useCallback(async (text: string, voiceId: string | undefined, epoch: number) => {
    // Skip playback entirely while muted (mic is recording)
    if (isMutedRef.current || epoch !== epochRef.current) {
      console.log('[ProspectVoice] Muted (mic active) — skipping TTS');
      return;
    }

    // Fully release previous audio before starting a new request
    stopPlayback();
    // Brief pause to let the browser release audio resources
    await new Promise(resolve => setTimeout(resolve, 150));

    if (!text.trim() || epoch !== epochRef.current || isMutedRef.current) return;

    const vid = voiceId || DEFAULT_VOICE_ID;
    console.log('[ProspectVoice] Speaking:', text.slice(0, 60) + '…', 'voiceId:', vid);

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

      console.log('[ProspectVoice] Calling ElevenLabs edge function…');
      if (epoch !== epochRef.current || isMutedRef.current) return;
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
        signal: AbortSignal.timeout(15000),
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
      });

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
      if (epoch !== epochRef.current || isMutedRef.current) return;
      if (!arrayBuffer.byteLength) {
        throw new Error('Empty TTS response body');
      }
      console.log('[ProspectVoice] Audio received, bytes:', arrayBuffer.byteLength);

      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      currentUrlRef.current = audioUrl;

      playbackDoneRef.current=new Promise<void>(resolve=>{finishPlaybackRef.current=resolve;});
      // Clean up when playback finishes naturally
      audio.onended = () => {
        console.log('[ProspectVoice] Playback ended naturally');
        finishPlaybackRef.current?.();
        finishPlaybackRef.current=null;
        releaseAudio();
      };
      audio.onerror = async (e) => {
        if (epoch !== epochRef.current || isMutedRef.current) return;
        console.warn('[ProspectVoice] Audio playback error:', e);
        releaseAudio();
        notifyBackup();
        await fallbackToWebSpeech(text, voiceId);
        if (epoch !== epochRef.current) return;
        finishPlaybackRef.current?.();
        finishPlaybackRef.current=null;
      };

      await audio.play();
      console.log('[ProspectVoice] Playback started');
    } catch (err) {
      if (epoch !== epochRef.current || isMutedRef.current) return;
      console.warn('[ProspectVoice] ElevenLabs failed, falling back to browser TTS:', err);
      notifyBackup();
      await fallbackToWebSpeech(text, voiceId);
      if (epoch !== epochRef.current) return;
      finishPlaybackRef.current?.();
      finishPlaybackRef.current=null;
    }
  }, [stopPlayback, releaseAudio, fallbackToWebSpeech, notifyBackup]);

  /** Queued speak — serializes requests so they never overlap */
  const speak = useCallback((text: string, voiceId?: string) => {
    const epoch = epochRef.current;
    // Chain onto the queue: wait for previous speak to finish, then play this one
    queueRef.current = queueRef.current
      .then(() => _speakImmediate(text, voiceId, epoch))
      .then(() => epoch === epochRef.current ? playbackDoneRef.current : undefined)
      .catch((err) => {
        console.warn('[ProspectVoice] Queue error:', err);
      });
    return queueRef.current;
  }, [_speakImmediate]);

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
