/**
 * PitchPerfect AI — WinCelebration Component
 *
 * The "DEAL CLOSED" moment. Shows when prospect's patience stays above threshold
 * and all 3 rounds are completed successfully.
 *
 * Sequence:
 *  1. Screen flashes green briefly
 *  2. Win sound plays (ascending chime)
 *  3. "Meeting Booked." fades in
 *  4. Score reveals with animated counter
 *  5. Confetti particles burst
 *  6. Buttons appear: "Run it back" + "Try different objection"
 *
 * Props:
 *  - score: number (1-10, from AI scoring)
 *  - feedback: string (AI-generated summary of what worked)
 *  - bestLine: string (user's strongest quote from the session)
 *  - onRunItBack: () => void
 *  - onNewObjection: () => void
 *  - onViewDebrief: () => void
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  delay: number;
}

interface WinCelebrationProps {
  score: number;
  feedback?: string;
  bestLine?: string;
  onRunItBack: () => void;
  onNewObjection: () => void;
  onViewDebrief?: () => void;
}

const CONFETTI_COLORS = [
  '#22C55E', // green
  '#10B981', // emerald
  '#34D399', // lighter green
  '#FCD34D', // gold
  '#FBBF24', // amber
  '#F59E0B', // yellow-orange
  '#FFFFFF', // white
];

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40, // center-ish burst
    y: 30 + Math.random() * 20,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 4 + Math.random() * 8,
    velocityX: (Math.random() - 0.5) * 80,
    velocityY: -40 - Math.random() * 60,
    delay: Math.random() * 0.3,
  }));
}

export default function WinCelebration({
  score,
  feedback,
  bestLine,
  onRunItBack,
  onNewObjection,
  onViewDebrief,
}: WinCelebrationProps) {
  const { playWinSound } = useSoundEffects();
  const [phase, setPhase] = useState<'flash' | 'title' | 'score' | 'details' | 'buttons'>('flash');
  const [displayScore, setDisplayScore] = useState(0);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const hasPlayedSound = useRef(false);

  // Animation sequence
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Green flash (0ms)
    setPhase('flash');
    setConfetti(generateConfetti(40));

    // Phase 2: Title appears (400ms)
    timers.push(setTimeout(() => setPhase('title'), 400));

    // Phase 3: Score counter starts (1200ms)
    timers.push(setTimeout(() => setPhase('score'), 1200));

    // Phase 4: Details/feedback (2200ms)
    timers.push(setTimeout(() => setPhase('details'), 2200));

    // Phase 5: Buttons appear (2800ms)
    timers.push(setTimeout(() => setPhase('buttons'), 2800));

    // Play sound
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      timers.push(setTimeout(() => {
        playWinSound();
      }, 200));
    }

    return () => timers.forEach(clearTimeout);
  }, [playWinSound]);

  // Animated score counter
  useEffect(() => {
    if (phase === 'score' || phase === 'details' || phase === 'buttons') {
      const target = score;
      const duration = 800;
      const steps = 20;
      const increment = target / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
          setDisplayScore(target);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.round(current * 10) / 10);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [phase, score]);

  const scoreColor = score >= 8 ? '#22C55E' : score >= 6 ? '#FBBF24' : '#F59E0B';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: phase === 'flash' ? '#15803d' : '#0a0a0a',
        transition: 'background-color 0.4s ease-out',
      }}
    >
      {/* Confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size * 0.6}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
              animation: `confetti-fall 2.5s ease-out ${p.delay}s forwards`,
              opacity: 0.9,
              '--vx': `${p.velocityX}px`,
              '--vy': `${p.velocityY}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* "Meeting Booked." title */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: phase !== 'flash' ? 1 : 0,
            transform: phase !== 'flash' ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
          }}
        >
          <p className="text-green-400 text-sm font-semibold tracking-[0.3em] uppercase mb-2">
            Deal Closed
          </p>
          <h1
            className="text-white font-bold leading-tight mb-1"
            style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}
          >
            Meeting Booked.
          </h1>
          <div className="w-16 h-0.5 bg-green-500 mx-auto mt-4 mb-8 rounded-full" />
        </div>

        {/* Score */}
        <div
          className="transition-all duration-500 ease-out mb-6"
          style={{
            opacity: ['score', 'details', 'buttons'].includes(phase) ? 1 : 0,
            transform: ['score', 'details', 'buttons'].includes(phase)
              ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          <div className="inline-flex items-baseline gap-1">
            <span
              className="font-bold tabular-nums"
              style={{ fontSize: '3.5rem', color: scoreColor }}
            >
              {displayScore.toFixed(1)}
            </span>
            <span className="text-gray-500 text-xl">/10</span>
          </div>
        </div>

        {/* Best line quote */}
        {bestLine && (
          <div
            className="transition-all duration-500 ease-out mb-6"
            style={{
              opacity: ['details', 'buttons'].includes(phase) ? 1 : 0,
              transform: ['details', 'buttons'].includes(phase)
                ? 'translateY(0)' : 'translateY(15px)',
            }}
          >
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
              Your strongest line
            </p>
            <p className="text-gray-300 text-sm italic leading-relaxed px-4">
              "{bestLine}"
            </p>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            className="transition-all duration-500 ease-out mb-8"
            style={{
              opacity: ['details', 'buttons'].includes(phase) ? 1 : 0,
              transform: ['details', 'buttons'].includes(phase)
                ? 'translateY(0)' : 'translateY(15px)',
            }}
          >
            <p className="text-gray-400 text-sm leading-relaxed">
              {feedback}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div
          className="flex flex-col gap-3 transition-all duration-500 ease-out"
          style={{
            opacity: phase === 'buttons' ? 1 : 0,
            transform: phase === 'buttons' ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          <button
            onClick={onRunItBack}
            className="w-full py-3.5 px-6 rounded-lg font-semibold text-black text-base
              transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: '#22C55E' }}
          >
            Run It Back
          </button>
          <button
            onClick={onNewObjection}
            className="w-full py-3 px-6 rounded-lg font-medium text-gray-300 text-sm
              border border-gray-700 hover:border-gray-500 transition-all duration-200
              active:scale-[0.98]"
          >
            Try Different Objection
          </button>
          {onViewDebrief && (
            <button
              onClick={onViewDebrief}
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors mt-1"
            >
              View full debrief →
            </button>
          )}
        </div>
      </div>

      {/* Confetti animation keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), calc(var(--vy) + 400px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
