/**
 * PitchPerfect AI — Sound Effects System
 *
 * Generates phone call sounds via Web Audio API.
 * Drop-in replacement: swap generateX() with audio file playback later.
 *
 * Usage:
 *   import { SoundEffects } from '@/utils/soundEffects';
 *   const sounds = new SoundEffects();
 *   await sounds.playDialTone();
 *   await sounds.playHangUp();
 *   await sounds.playWinSound();
 */

class SoundEffectsEngine {
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Must be called from a user gesture (click/tap) to unlock audio on iOS/mobile.
   * Call this once on any user interaction before playing sounds.
   */
  async unlock(): Promise<void> {
    if (this.isUnlocked) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    // Play a silent buffer to unlock on iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    this.isUnlocked = true;
  }

  /**
   * Phone ringing sound — US standard ring (440Hz + 480Hz, 2-on 4-off pattern)
   * Plays 2 rings (~4 seconds total)
   */
  async playDialTone(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.15, now); // Keep it subtle

    // US ring: two sine waves (440Hz + 480Hz), 2s on, 4s off
    for (let ring = 0; ring < 2; ring++) {
      const ringStart = now + ring * 3; // 2s ring + 1s gap
      const ringEnd = ringStart + 1.8;

      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ringStart);
        osc.connect(gainNode);
        osc.start(ringStart);
        osc.stop(ringEnd);
      });

      // Fade in/out for each ring to avoid clicks
      gainNode.gain.setValueAtTime(0, ringStart);
      gainNode.gain.linearRampToValueAtTime(0.15, ringStart + 0.05);
      gainNode.gain.setValueAtTime(0.15, ringEnd - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ringEnd);
    }

    // Return promise that resolves when ringing is done
    return new Promise((resolve) => {
      setTimeout(resolve, 4200); // 2 rings complete
    });
  }

  /**
   * Hang-up / busy signal — sharp beeps (480Hz + 620Hz, fast repeating)
   * The "they hung up on you" sound
   */
  async playHangUp(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    // Busy signal: 480Hz + 620Hz, 0.5s on, 0.5s off
    for (let beep = 0; beep < 3; beep++) {
      const beepStart = now + beep * 0.7;
      const beepEnd = beepStart + 0.4;

      [480, 620].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, beepStart);
        osc.connect(gainNode);
        osc.start(beepStart);
        osc.stop(beepEnd);
      });

      gainNode.gain.setValueAtTime(0.2, beepStart);
      gainNode.gain.setValueAtTime(0, beepEnd);
    }

    return new Promise((resolve) => {
      setTimeout(resolve, 2200);
    });
  }

  /**
   * Win sound — ascending chime / cash register feel
   * The "DEAL CLOSED" celebration trigger
   */
  async playWinSound(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.2, now);

    // Ascending three-note chime: C5 → E5 → G5 (major chord arpeggio)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const noteStart = now + i * 0.15;
      const osc = ctx.createOscillator();
      osc.type = 'triangle'; // Warmer, bell-like tone
      osc.frequency.setValueAtTime(freq, noteStart);
      osc.connect(gainNode);
      osc.start(noteStart);
      osc.stop(noteStart + 0.4);
    });

    // Final sustained "ding" — higher octave
    const dingStart = now + 0.5;
    const ding = ctx.createOscillator();
    ding.type = 'sine';
    ding.frequency.setValueAtTime(1046.5, dingStart); // C6
    ding.connect(gainNode);
    ding.start(dingStart);
    ding.stop(dingStart + 0.6);

    // Fade out
    gainNode.gain.setValueAtTime(0.2, dingStart + 0.3);
    gainNode.gain.linearRampToValueAtTime(0, dingStart + 0.6);

    return new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
  }

  /**
   * Subtle "click" sound — for the moment the prospect hangs up
   * Sharp, short, unsettling
   */
  async playClick(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    // Short noise burst = phone click
    const bufferSize = ctx.sampleRate * 0.03; // 30ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.03);
    source.start(now);

    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  /**
   * Full "call start" sequence: ring ring... silence... ready
   * Use before the roleplay conversation begins
   */
  async playCallStart(): Promise<void> {
    await this.playDialTone();
    // Brief silence after ringing (the "pickup" moment)
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  /**
   * Full "hang up" sequence: click → pause → busy signal
   * Use when patience hits 0 or prospect ends call
   */
  async playCallEnd(): Promise<void> {
    await this.playClick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await this.playHangUp();
  }

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const SoundEffects = new SoundEffectsEngine();
