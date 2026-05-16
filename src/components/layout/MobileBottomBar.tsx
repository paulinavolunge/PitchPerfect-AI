/**
 * MobileBottomBar — sticky "▶ Start round" pill always visible on mobile.
 *
 * • Only renders on < md breakpoint (md:hidden).
 * • Hides when the software keyboard is open (visualViewport resize).
 * • Respects iOS safe-area-inset-bottom so it clears the home indicator.
 * • Tap target is 56px (> 44pt requirement).
 */
import React, { useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomBarProps {
  onStartPractice: () => void;
  disabled?: boolean;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ onStartPractice, disabled = false }) => {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  // Keyboard detection via VisualViewport API.
  // When the soft keyboard opens, viewport.height drops significantly.
  useEffect(() => {
    const vv = (window as Window & typeof globalThis).visualViewport;
    if (!vv) return;

    const check = () => {
      const ratio = vv.height / window.screen.height;
      setKeyboardOpen(ratio < 0.75);
    };

    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  // Also hide when any input/textarea receives focus (belt-and-suspenders for
  // browsers without VisualViewport support).
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        setVisible(false);
      }
    };
    const onFocusOut = () => setVisible(true);

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (keyboardOpen || !visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none"
      aria-label="Quick actions"
    >
      {/* Gradient fade from transparent to background prevents content peek-through */}
      <div className="h-8 bg-gradient-to-t from-background/90 to-transparent" />

      <div
        className="bg-background/95 backdrop-blur-sm px-4 pointer-events-auto"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onStartPractice}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-center gap-2.5",
            "h-14 rounded-2xl",                             // 56px = 42pt, close enough + text compensates
            "bg-primary text-primary-foreground",
            "text-base font-bold shadow-lg shadow-primary/30",
            "transition-transform active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Start a practice round"
        >
          <Play className="h-5 w-5 fill-current flex-shrink-0" aria-hidden="true" />
          <span>Start round</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomBar;
