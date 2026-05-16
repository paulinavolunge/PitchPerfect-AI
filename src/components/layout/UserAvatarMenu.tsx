/**
 * UserAvatarMenu — authenticated user avatar dropdown.
 * Includes Credits + Plan pills previously shown on the dashboard body.
 */
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  UserRound,
  CreditCard,
  Crown,
  LogIn,
  Infinity,
} from "lucide-react";
import { isPremiumFeaturesEnabled } from "@/config/features";

const STRIPE_UNLIMITED_URL = "https://buy.stripe.com/14A14pakJ7eq4NceFs5sA02";

function initials(user: NonNullable<ReturnType<typeof useAuth>["user"]>): string {
  const meta = user.user_metadata;
  if (meta?.first_name && meta?.last_name)
    return `${meta.first_name.charAt(0)}${meta.last_name.charAt(0)}`;
  if (meta?.name) return meta.name.charAt(0);
  return user.email?.charAt(0).toUpperCase() ?? "?";
}

function planLabel(isPremium: boolean, plan: string | null): string {
  if (!plan) return isPremium ? "Premium" : "Pay-as-you-go";
  if (plan.toLowerCase().includes("team")) return "Team";
  if (plan.toLowerCase().includes("unlimited") || isPremium) return "Premium";
  return "Pay-as-you-go";
}

const UserAvatarMenu: React.FC = () => {
  const { user, signOut, isPremium, creditsRemaining } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    try { await signOut(); } catch { navigate("/"); }
  };

  const handleUpgrade = () =>
    window.open(STRIPE_UNLIMITED_URL, "_blank", "noopener,noreferrer");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          aria-label="User account menu"
          data-testid="user-menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.user_metadata?.avatar_url}
              alt={`Profile picture of ${user.user_metadata?.name || user.email}`}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60 bg-popover z-50" align="end" forceMount>
        {/* Identity */}
        <DropdownMenuLabel className="font-normal pb-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold leading-none">
              {user.user_metadata?.name || user.email?.split("@")[0]}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        {/* Credits + Plan pills */}
        <div className="px-2 pb-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
            <CreditCard className="h-3 w-3 text-muted-foreground" />
            {isPremium ? (
              <Infinity className="h-3 w-3" aria-label="Unlimited credits" />
            ) : (
              <span>{creditsRemaining ?? 0} credits</span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isPremium
                ? "bg-amber-100 text-amber-800"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Crown className={`h-3 w-3 ${isPremium ? "text-amber-600" : "text-muted-foreground"}`} />
            {planLabel(isPremium, user.user_metadata?.subscription_plan ?? null)}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer w-full">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/progress" className="cursor-pointer w-full">
            <UserRound className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/subscription" className="cursor-pointer w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>

        {isPremiumFeaturesEnabled() && !isPremium && (
          <DropdownMenuItem onClick={handleUpgrade} className="cursor-pointer text-blue-600">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro — $29/mo
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer"
          data-testid="logout-button-menu"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
