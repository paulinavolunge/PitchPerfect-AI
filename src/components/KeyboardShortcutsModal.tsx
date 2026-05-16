import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  label: string;
  category?: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { category: "Navigation", keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["?"], label: "Show keyboard shortcuts" },
  // Command palette
  { category: "Command palette", keys: ["↑", "↓"], label: "Move selection" },
  { keys: ["↵"], label: "Select item" },
  { keys: ["Esc"], label: "Close / dismiss" },
  // App shortcuts
  { category: "App", keys: ["⌘", "P"], label: "Quick practice (coming soon)" },
  { keys: ["⌘", "D"], label: "Dashboard (coming soon)" },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground shadow-[0_1px_0_hsl(var(--border))]">
    {children}
  </kbd>
);

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ open, onClose }) => {
  let lastCategory = "";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs sm:max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span aria-hidden="true">⌨️</span>
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map(({ keys, label, category }, i) => {
            const showCategory = category && category !== lastCategory;
            if (category) lastCategory = category;

            return (
              <React.Fragment key={label}>
                {showCategory && (
                  <p className={`text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ${i > 0 ? "pt-3" : ""}`}>
                    {category}
                  </p>
                )}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground">{label}</span>
                  <div className="flex items-center gap-0.5">
                    {keys.map((k, j) => (
                      <React.Fragment key={k}>
                        {j > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                        <Kbd>{k}</Kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <Kbd>Esc</Kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsModal;
