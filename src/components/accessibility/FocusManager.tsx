
import React, { useEffect, useRef } from 'react';
import { manageFocus, handleEscapeKey } from '@/utils/accessibility';

interface FocusManagerProps {
  children: React.ReactNode;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  autoFocus?: boolean;
  onEscape?: () => void;
  focusSelector?: string;
}

export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  restoreFocus = true,
  trapFocus = false,
  autoFocus = false,
  onEscape,
  focusSelector
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusTrapCleanupRef = useRef<(() => void) | null>(null);
  const escapeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Save current focus if we need to restore it later
    if (restoreFocus) {
      previousFocusRef.current = manageFocus.save();
    }

    // Set up focus trap
    if (trapFocus && containerRef.current) {
      focusTrapCleanupRef.current = manageFocus.trap(containerRef.current);
    }

    // Set up escape key handler
    if (onEscape) {
      escapeCleanupRef.current = handleEscapeKey(onEscape);
    }

    // Auto focus if requested
    if (autoFocus && containerRef.current) {
      if (focusSelector) {
        manageFocus.moveTo(focusSelector);
      } else {
        const firstFocusable = containerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }

    // Cleanup function
    return () => {
      if (focusTrapCleanupRef.current) {
        focusTrapCleanupRef.current();
      }
      
      if (escapeCleanupRef.current) {
        escapeCleanupRef.current();
      }
      
      if (restoreFocus && previousFocusRef.current) {
        manageFocus.restore(previousFocusRef.current);
      }
    };
  }, [restoreFocus, trapFocus, autoFocus, onEscape, focusSelector]);

  return (
    <div ref={containerRef} className="focus-manager">
      {children}
    </div>
  );
};
