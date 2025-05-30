import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
// TEMP FIX: Commented out broken hook import
// import { useGuestMode } from "@/context/GuestModeContext";
import { Menu, UserPlus, LogIn, Home, UserRound, Crown, Diamond } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';

const Navbar: React.FC = () => {
  const { user, signOut, isPremium, creditsRemaining, trialUsed } = useAuth();

  // TEMP FIX: Hardcoded guest mode until context is confirmed working
  const isGuestMode = false;
  const endGuestMode = () => {};

  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    console.log('Auth state in Navbar:', {
      user,
      isGuestMode,
      user_is_null: user === null,
      showAuthenticatedUI: Boolean(user) && !isGuestMode,
      creditsRemaining,
      trialUsed,
    });
  }, [user, isGuestMode, creditsRemaining, trialUsed]);

  const handleSignup = () => {
    if (isGuestMode) endGuestMode();
    navigate('/signup');
  };

  const handleLogin = () => {
    if (isGuestMode) endGuestMode();
    navigate('/login');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return '';
    const meta = user.user_metadata;
    return meta?.first_name && meta?.last_name ?
      `${meta.first_name.charAt(0)}${meta.last_name.charAt(0)}` :
      meta?.name?.charAt(0) || user.email?.charAt(0).toUpperCase() || '';
  };

  const showAuthenticatedUI = Boolean(user) && user !== null && !isGuestMode;

  const userNavigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Practice', href: '/practice' },
    { name: 'Role Play', href: '/roleplay' },
    { name: 'Progress', href: '/progress' },
    { name: 'Call Recordings', href: '/call-recordings' },
    { name: 'Tips', href: '/tips' }
  ];

  const guestNavigationItems = [
    { name: 'About', href: '/about' },
    { name: 'Compare', href: '/compare' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Demo', href: '/demo' }
  ];

  const guestModeItems = [
    { name: 'Role Play', href: '/roleplay' },
    { name: 'Demo', href: '/demo' }
  ];

  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Practice', href: '/practice' },
    { name: 'Role Play', href: '/roleplay' },
    { name: 'Tips', href: '/tips' }
  ];

  return (
    <nav className={`bg-background border-b w-full z-50 transition-all duration-300 ${scrolled ? 'sticky top-0 shadow-sm' : ''}`}>
      {/* ...rest of the JSX remains unchanged */}
    </nav>
  );
};

export default Navbar;
