import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, Target, Users, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_DEFAULTS, DEFAULT_ROLE, type UserRole } from "@/lib/roleDefaults";

interface RoleCard {
  role: UserRole;
  Icon: React.FC<{ className?: string }>;
  color: string;
  selectedColor: string;
}

const CARDS: RoleCard[] = [
  { role: "sdr",     Icon: Phone,  color: "hover:border-blue-400",   selectedColor: "border-blue-500 bg-blue-50/60" },
  { role: "ae",      Icon: Target, color: "hover:border-violet-400",  selectedColor: "border-violet-500 bg-violet-50/60" },
  { role: "manager", Icon: Users,  color: "hover:border-amber-400",   selectedColor: "border-amber-500 bg-amber-50/60" },
  { role: "founder", Icon: Rocket, color: "hover:border-green-400",   selectedColor: "border-green-500 bg-green-50/60" },
];

const OnboardingRole: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  const returnTo: string =
    (location.state as { returnTo?: string } | null)?.returnTo ?? "/dashboard";

  const saveRole = useCallback(
    async (role: UserRole) => {
      if (!user?.id || saving) return;
      setSaving(true);
      setSelected(role);

      try {
        await supabase
          .from("user_profiles")
          .update({ role, onboarding_completed_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch {
        // non-critical — proceed regardless
      }

      const { firstRoundPath } = ROLE_DEFAULTS[role];
      navigate(firstRoundPath, { replace: true });
    },
    [user?.id, saving, navigate]
  );

  const handleSkip = useCallback(async () => {
    await saveRole(DEFAULT_ROLE);
  }, [saveRole]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header — logo only */}
      <header className="px-6 pt-6 pb-2 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">P</span>
          </div>
          <span className="font-bold text-base text-foreground">PitchPerfect AI</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-10">
        {/* Headline */}
        <div className="text-center mb-10 max-w-md">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            What's your role?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            We'll set up your first scenario to match your day-to-day.
          </p>
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {CARDS.map(({ role, Icon, color, selectedColor }) => {
            const cfg = ROLE_DEFAULTS[role];
            const isSelected = selected === role;
            const isLoading = saving && isSelected;

            return (
              <button
                key={role}
                type="button"
                onClick={() => saveRole(role)}
                disabled={saving}
                className={cn(
                  "relative flex flex-col items-start gap-3 rounded-2xl border-2 bg-card p-5 text-left",
                  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "disabled:cursor-wait",
                  isSelected ? selectedColor : `border-border ${color}`,
                  !saving && "hover:shadow-md active:scale-[0.98]"
                )}
                aria-pressed={isSelected}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isSelected ? "bg-background" : "bg-muted"
                  )}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 text-foreground" />
                  )}
                </div>

                {/* Text */}
                <div>
                  <p className="font-semibold text-foreground leading-tight">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {cfg.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip link */}
        <div className="mt-8 text-center space-y-1">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors disabled:opacity-50"
          >
            Set this later
          </button>
          <p className="text-xs text-muted-foreground/60">
            We'll default to AE scenarios — you can change anytime in profile settings.
          </p>
        </div>
      </main>
    </div>
  );
};

export default OnboardingRole;
