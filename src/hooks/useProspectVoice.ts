import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ELEVENLABS_VOICE_ID = 'CwhRBWXzGAHq8TQ4Fs17'; // Roger — natural, professional

/**
 * Hook that speaks prospect responses via ElevenLabs TTS,
 * with automatic fallback to browser SpeechSynthesis.
 *
 * Non-blocking: returns immediately, plays audio when ready.
 */
export function useProspectVoice() {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
  );

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    // Stop browser TTS
    synthRef.current?.cancel();
  }, []);

  const fallbackToWebSpeech = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.95;

    // Prefer natural-sounding voices
    const voices = synth.getVoices();
    const preferred = ['samantha', 'google us english female', 'microsoft zira', 'female'];
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

  const speak = useCallback(async (text: string) => {
    // Stop any current playback first
    stop();

    if (!text.trim()) return;

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

      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 500),
          voiceId: ELEVENLABS_VOICE_ID,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS edge function error: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.audioContent) {
        throw new Error('No audioContent in response');
      }

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

      // Clean up object URL when done
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        console.warn('[ProspectVoice] Audio playback failed, falling back to browser TTS');
        fallbackToWebSpeech(text);
      };

      await audio.play();
    } catch (err) {
      console.warn('[ProspectVoice] ElevenLabs failed, falling back to browser TTS:', err);
      fallbackToWebSpeech(text);
    }
  }, [stop, fallbackToWebSpeech]);

  return { speak, stop };
}
