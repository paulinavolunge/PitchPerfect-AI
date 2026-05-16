export type UserRole = "sdr" | "ae" | "manager" | "founder";

export interface RoleConfig {
  label: string;
  description: string;
  defaultScenario: string;
  /** Scenario to open for the post-onboarding first round */
  firstRoundPath: string;
}

/** Single source of truth for role → scenario routing. */
export const ROLE_DEFAULTS: Record<UserRole, RoleConfig> = {
  sdr: {
    label: "SDR / BDR",
    description: "Cold-call openers and early-stage objection handling.",
    defaultScenario: "cold-call-opener",
    firstRoundPath: "/rounds/new?scenario=cold-call-opener",
  },
  ae: {
    label: "AE",
    description: "Discovery calls, demos, and closing objections.",
    defaultScenario: "discovery-objection",
    firstRoundPath: "/rounds/new?scenario=discovery-objection",
  },
  manager: {
    label: "Sales Manager",
    description: "Demo-ready scripts and team coaching visibility.",
    defaultScenario: "demo",
    firstRoundPath: "/rounds/new?scenario=demo",
  },
  founder: {
    label: "Founder",
    description: "Land your first customers with a tight, honest pitch.",
    defaultScenario: "discovery",
    firstRoundPath: "/rounds/new?scenario=discovery",
  },
};

/** The role used when a user clicks "Set this later". */
export const DEFAULT_ROLE: UserRole = "ae";
