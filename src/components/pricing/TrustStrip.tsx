import React from 'react';

const BADGES = [
  '✓ 7-day money-back guarantee',
  '✓ Cancel in one click',
  '✓ Your voice never leaves the session',
] as const;

const TrustStrip: React.FC = () => (
  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 mt-4 text-sm text-gray-400">
    {BADGES.map((b, i) => (
      <React.Fragment key={b}>
        <span className="whitespace-nowrap">{b}</span>
        {i < BADGES.length - 1 && (
          <span className="hidden sm:inline text-gray-200" aria-hidden>|</span>
        )}
      </React.Fragment>
    ))}
  </div>
);

export default TrustStrip;
