import React from 'react';

interface AccessibilityEnhancementsProps {
  children: React.ReactNode;
  announcePageChange?: boolean;
}

export const AccessibilityEnhancements: React.FC<AccessibilityEnhancementsProps> = ({
  children,
  announcePageChange = true
}) => {
  // Live region for announcements
  const [announcement, setAnnouncement] = React.useState('');

  React.useEffect(() => {
    if (announcePageChange) {
      setAnnouncement('Page loaded: PitchPerfect AI homepage');
      // Clear announcement after it's been read
      const timer = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [announcePageChange]);

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      {/* Main content with enhanced landmarks */}
      <div role="document">
        {children}
      </div>
    </>
  );
};

export default AccessibilityEnhancements;