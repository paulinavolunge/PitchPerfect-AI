import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { useGuestMode } from "@/context/GuestModeContext";
import { Menu, UserPlus, LogIn, Home, UserRound, Crown, Diamond } from 'lucide-react'; // Added Diamond icon
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

const Navbar: React.FC = () => {
  // Access new creditsRemaining and trialUsed from useAuth
  const { user, signOut, isPremium, creditsRemaining, trialUsed } = useAuth();
  const { isGuestMode, endGuestMode } = useGuestMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log('Auth state in Navbar:', { 
      user, 
      isGuestMode, 
      user_is_null: user === null,
      showAuthenticatedUI: Boolean(user) && !isGuestMode,
      creditsRemaining, // Debugging credits
      trialUsed, // Debugging trialUsed
    });
  }, [user, isGuestMode, creditsRemaining, trialUsed]);

  const handleSignup = () => {
    if (isGuestMode) {
      endGuestMode();
    }
    navigate('/signup');
  };

  const handleLogin = () => {
    if (isGuestMode) {
      endGuestMode();
    }
    navigate('/login');
  };

  // Handle logout with improved state cleanup, forced navigation, and page reload
  const handleSignOut = async () => {
    try {
      await signOut();
      // Completely reset the app state after logout
      window.location.href = '/'; // Force a full page reload and navigation to home
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '';

    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `<span class="math-inline">\{user\.user\_metadata\.first\_name\.charAt\(0\)\}</span>{user.user_metadata.last_name.charAt(0)}`;
    } else if (user.user_metadata?.name) {
      return user.user_metadata.name.charAt(0);
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '';
  };

  // Navigation items (mostly unchanged)
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

  // Main navigation items for authenticated users
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Practice', href: '/practice' },
    { name: 'Role Play', href: '/roleplay' },
    { name: 'Tips', href: '/tips' }
  ];

  // Determine if we should show the authenticated UI elements
  const showAuthenticatedUI = Boolean(user) && user !== null && !isGuestMode;

  return (
    <nav 
      className={`bg-background border-b w-full z-50 transition-all duration-300 ${
        scrolled ? 'sticky top-0 shadow-sm' : ''
      }`}
    >
      <div className="container max-w-screen-xl flex flex-wrap items-center justify-between py-3 mx-auto px-4">
        <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-brand-dark">
            PitchPerfect AI
          </span>
        </Link>

        {/* Main Navigation Menu for authenticated users */}
        {showAuthenticatedUI && (
          <div className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link 
                    to="/"
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                      location.pathname === '/' 
                        ? 'bg-accent/50 text-accent-foreground' 
                        : 'text-foreground'
                    }`}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Link>
                </NavigationMenuItem>
                {mainNavItems.map(item => (
                  <NavigationMenuItem key={item.name}>
                    <Link 
                      to={item.href}
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                        location.pathname === item.href 
                          ? 'bg-accent/50 text-accent-foreground' 
                          : 'text-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}

        <div className="flex items-center md:order-3">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-6 w-6 text-brand-dark" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-
