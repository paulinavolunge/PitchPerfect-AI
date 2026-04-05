import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ElevenLabs voice IDs
export const VOICE_FEMALE = '21m00Tcm4TlvDq8ikWAM'; // Rachel — warm, professional female
export const VOICE_MALE = 'CwhRBWXzGAHq8TQ4Fs17';   // Roger — natural, professional male
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

  const stop = useCallback(() => {
    releaseAudio();
    // Stop browser TTS
    synthRef.current?.cancel();
  }, [releaseAudio]);

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

    synth.speak(utterance);
  }, []);

  const _speakImmediate = useCallback(async (text: string, voiceId?: string) => {
    // Skip playback entirely while muted (mic is recording)
    if (isMutedRef.current) {
      console.log('[ProspectVoice] Muted (mic active) — skipping TTS');
      return;
    }

    // Fully release previous audio before starting a new request
    stop();
    // Brief pause to let the browser release audio resources
    await new Promise(resolve => setTimeout(resolve, 150));

    if (!text.trim()) return;

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
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
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

      const data = await response.json();

      if (!data?.audioContent) {
        throw new Error('No audioContent in response');
      }

      console.log('[ProspectVoice] Audio received, base64 length:', data.audioContent.length);

      // Decode base64 → audio blob → play
      const binaryStr = atob(data.audioContent);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      currentUrlRef.current = audioUrl;

      // Clean up when playback finishes naturally
      audio.onended = () => {
        console.log('[ProspectVoice] Playback ended naturally');
        releaseAudio();
      };
      audio.onerror = (e) => {
        console.warn('[ProspectVoice] Audio playback error:', e);
        releaseAudio();
        fallbackToWebSpeech(text, voiceId);
      };

      await audio.play();
      console.log('[ProspectVoice] Playback started');
    } catch (err) {
      console.warn('[ProspectVoice] ElevenLabs failed, falling back to browser TTS:', err);
      fallbackToWebSpeech(text, voiceId);
    }
  }, [stop, releaseAudio, fallbackToWebSpeech]);

  /** Queued speak — serializes requests so they never overlap */
  const speak = useCallback((text: string, voiceId?: string) => {
    // Chain onto the queue: wait for previous speak to finish, then play this one
    queueRef.current = queueRef.current
      .then(() => _speakImmediate(text, voiceId))
      .then(() => {
        // Wait for playback to finish before allowing next queued item
        return new Promise<void>((resolve) => {
          const audio = currentAudioRef.current;
          if (!audio) { resolve(); return; }
          // If already ended, resolve immediately
          if (audio.ended || audio.paused) { resolve(); return; }
          const orig = audio.onended;
          audio.onended = (e) => {
            if (typeof orig === 'function') orig.call(audio, e);
            resolve();
          };
          // Safety timeout — don't block the queue forever
          setTimeout(resolve, 15000);
        });
      })
      .catch((err) => {
        console.warn('[ProspectVoice] Queue error:', err);
      });
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
