/**
 * PitchPerfect AI — useSoundEffects hook
 *
 * Wraps SoundEffects engine with auto-unlock on first user interaction.
 *
 * Usage:
 *   const { playCallStart, playCallEnd, playWinSound } = useSoundEffects();
 *
 *   // In your "Start Call" button handler:
 *   const handleStartCall = async () => {
 *     await playCallStart();
 *     // ... begin roleplay
 *   };
 */

import { useCallback, useEffect, useRef } from 'react';
import { SoundEffects } from '@/utils/soundEffects';

export function useSoundEffects() {
  const unlocked = useRef(false);

  // Unlock audio context on first user interaction (required for iOS/mobile)
  useEffect(() => {
    const handleInteraction = async () => {
      if (!unlocked.current) {
        await SoundEffects.unlock();
        unlocked.current = true;
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const playCallStart = useCallback(async () => {
    try {
      await SoundEffects.playCallStart();
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  const playCallEnd = useCallback(async () => {
    try {
      await SoundEffects.playCallEnd();
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  const playWinSound = useCallback(async () => {
    try {
      await SoundEffects.playWinSound();
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  const playHangUp = useCallback(async () => {
    try {
      await SoundEffects.playHangUp();
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  const playClick = useCallback(async () => {
    try {
      await SoundEffects.playClick();
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, []);

  return {
    playCallStart,  // Ring ring → silence → ready
    playCallEnd,    // Click → busy signal
    playWinSound,   // Ascending chime → ding
    playHangUp,     // Busy signal only
    playClick,      // Sharp click only
  };
}
