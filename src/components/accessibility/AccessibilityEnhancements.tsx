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

  // Enhanced keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content with Alt+1
      if (event.altKey && event.key === '1') {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          event.preventDefault();
        }
      }
      
      // Skip to navigation with Alt+2
      if (event.altKey && event.key === '2') {
        const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
        if (nav) {
          (nav as HTMLElement).focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
        aria-label="Page status announcements"
      >
        {announcement}
      </div>

      {/* Main content with enhanced landmarks and focus management */}
      <div role="document" className="relative">
        {children}
      </div>
    </>
  );
};

export default AccessibilityEnhancements;