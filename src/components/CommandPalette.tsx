/**
 * CommandPalette — global Cmd+K / Ctrl+K launcher.
 *
 * Mount this once inside Router + AuthProvider context.
 * It owns the KeyboardShortcutsModal so no extra state is needed in App.
 */
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Play,
  RotateCcw,
  FileSearch,
  BookOpen,
  CreditCard,
  Moon,
  Sun,
  LogOut,
  Keyboard,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const KeyboardShortcutsModal = lazy(() => import("./KeyboardShortcutsModal"));

// ── Route prefetch helpers ─────────────────────────────────────────────────
// Calling these triggers Vite to fetch the JS chunk so subsequent navigation
// is instant (< 100 ms). They are fired on CommandItem hover / focus.
const prefetchDashboard  = () => import("@/pages/Dashboard");
const prefetchPractice   = () => import("@/pages/Practice");
const prefetchProgress   = () => import("@/pages/Progress");
const prefetchTips       = () => import("@/pages/Tips");
const prefetchSubs       = () => import("@/pages/Subscription");
const prefetchSession    = () => import("@/pages/SessionDetail");

interface RecentRound {
  id: string;
  scenario_type: string;
  score: number | null;
  created_at: string;
}

// ── isMac helper ────────────────────────────────────────────────────────────
const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? "⌘" : "Ctrl";

const CommandPalette: React.FC = () => {
  const navigate     = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [open, setOpen]           = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [recentRounds, setRecentRounds]   = useState<RecentRound[]>([]);
  const [hasFinePointer, setHasFinePointer] = useState(true);

  // Detect touch-only device for the floating pill
  useEffect(() => {
    const mql = window.matchMedia("(pointer: fine)");
    setHasFinePointer(mql.matches);
    const handler = (e: MediaQueryListEvent) => setHasFinePointer(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Fetch last 3 scored rounds when palette opens
  useEffect(() => {
    if (!open || !user?.id) return;
    supabase
      .from("practice_sessions")
      .select("id, scenario_type, score, created_at")
      .eq("user_id", user.id)
      .eq("status", "scored")
      .not("score", "is", null)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setRecentRounds(data ?? []));
  }, [open, user?.id]);

  // ── Global key listeners ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K — toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // "?" — open shortcuts when no text input is focused and palette is closed
      if (
        e.key === "?" &&
        !open &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target as HTMLElement).isContentEditable
      ) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Close helper: dismiss palette then run action after animation settles
  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 60);
  }, []);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    try {
      await signOut();
    } catch {
      toast.error("Sign out failed — please try again.");
    }
  }, [signOut]);

  const handleToggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    toast.success(`Switched to ${next} mode`);
  }, [theme, setTheme]);

  const isDark = theme === "dark";

  return (
    <>
      {/* ── Mobile floating pill (touch-only devices) ──────────────────── */}
      {!hasFinePointer && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open command palette"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-foreground/90 px-4 py-2.5 text-sm font-semibold text-background shadow-xl backdrop-blur-sm transition-transform active:scale-95"
        >
          ⌘K
        </button>
      )}

      {/* ── Command dialog ─────────────────────────────────────────────── */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={`Search commands… (${modKey}K to toggle)`} />

        <CommandList>
          <CommandEmpty>No results — try "start", "billing", or "log out".</CommandEmpty>

          {/* ── Practice ──────────────────────────────────────────────── */}
          <CommandGroup heading="Practice">
            <CommandItem
              onSelect={() => run(() => navigate("/practice"))}
              onMouseEnter={prefetchPractice}
              onFocus={prefetchPractice}
            >
              <Play className="mr-2 h-4 w-4 text-primary" />
              Start a round
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => run(() => navigate("/practice?resume=last"))}
              onMouseEnter={prefetchPractice}
              onFocus={prefetchPractice}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Resume last scenario
            </CommandItem>

            <CommandItem
              onSelect={() => run(() => navigate("/dashboard"))}
              onMouseEnter={prefetchDashboard}
              onFocus={prefetchDashboard}
            >
              <FileSearch className="mr-2 h-4 w-4" />
              Review last round
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* ── Navigate ──────────────────────────────────────────────── */}
          <CommandGroup heading="Go to">
            <CommandItem
              onSelect={() => run(() => navigate("/tips"))}
              onMouseEnter={prefetchTips}
              onFocus={prefetchTips}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Coaching library
            </CommandItem>

            <CommandItem
              onSelect={() => run(() => navigate("/subscription"))}
              onMouseEnter={prefetchSubs}
              onFocus={prefetchSubs}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </CommandItem>
          </CommandGroup>

          {/* ── Recent rounds quick-jump ───────────────────────────────── */}
          {recentRounds.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent rounds">
                {recentRounds.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`recent-${r.id}-${r.scenario_type}`}
                    onSelect={() => run(() => navigate(`/practice/${r.id}`))}
                    onMouseEnter={prefetchSession}
                    onFocus={prefetchSession}
                  >
                    <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate capitalize">
                      {r.scenario_type.replace(/_/g, " ")}
                    </span>
                    {r.score !== null && (
                      <CommandShortcut
                        className={
                          r.score >= 70
                            ? "text-green-600"
                            : r.score >= 50
                            ? "text-amber-500"
                            : "text-red-500"
                        }
                      >
                        {r.score}%
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          {/* ── System ────────────────────────────────────────────────── */}
          <CommandGroup heading="System">
            <CommandItem onSelect={() => run(handleToggleTheme)}>
              {isDark ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Switch to {isDark ? "light" : "dark"} mode
            </CommandItem>

            <CommandItem
              onSelect={() => {
                setOpen(false);
                setTimeout(() => setShortcutsOpen(true), 60);
              }}
            >
              <Keyboard className="mr-2 h-4 w-4" />
              Show keyboard shortcuts
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>

            {user && (
              <CommandItem
                onSelect={handleSignOut}
                className="data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>

        {/* Footer hint */}
        <div className="border-t border-border px-3 py-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
          <span className="ml-auto">{modKey}K</span>
        </div>
      </CommandDialog>

      {/* ── Keyboard shortcuts modal ────────────────────────────────────── */}
      <Suspense fallback={null}>
        <KeyboardShortcutsModal
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
      </Suspense>
    </>
  );
};

export default CommandPalette;
