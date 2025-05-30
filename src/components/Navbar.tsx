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
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`;
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
            {/* CORRECTED: SheetContent is now a container for mobile navigation */}
            <SheetContent side="left" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>
                        Explore your options.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-4">
                    {showAuthenticatedUI ? (
                        <>
                            <Link to="/" className="text-lg font-medium hover:text-brand-dark" onClick={() => { /* close sheet logic */ }}>Home</Link>
                            {mainNavItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="text-lg font-medium hover:text-brand-dark"
                                    onClick={() => { /* close sheet logic */ }}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <DropdownMenuSeparator />
                            <Link to="/profile" className="text-lg font-medium hover:text-brand-dark" onClick={() => { /* close sheet logic */ }}>
                                Profile
                            </Link>
                            <Link to="/pricing" className="text-lg font-medium hover:text-brand-dark" onClick={() => { /* close sheet logic */ }}>
                                <span className="flex items-center">
                                    <Crown className="h-5 w-5 mr-2 text-yellow-500" /> Upgrade
                                </span>
                            </Link>
                            <Button onClick={handleSignOut} className="w-full mt-4">
                                Sign Out
                            </Button>
                        </>
                    ) : isGuestMode ? (
                        <>
                            {guestModeItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="text-lg font-medium hover:text-brand-dark"
                                    onClick={() => { /* close sheet logic */ }}
                                >
                                    {item.name}
                                </Link>
                            ))}
                             <Link to="/pricing" className="text-lg font-medium hover:text-brand-dark" onClick={() => { /* close sheet logic */ }}>
                                <span className="flex items-center">
                                    <Diamond className="h-5 w-5 mr-2 text-blue-500" /> Unlock Full Access
                                </span>
                            </Link>
                            <Button onClick={handleSignup} className="w-full mt-4">
                                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                            </Button>
                            <Button onClick={handleLogin} variant="outline" className="w-full mt-2">
                                <LogIn className="mr-2 h-4 w-4" /> Log In
                            </Button>
                        </>
                    ) : (
                        <>
                            {guestNavigationItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="text-lg font-medium hover:text-brand-dark"
                                    onClick={() => { /* close sheet logic */ }}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <Button onClick={handleSignup} className="w-full mt-4">
                                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                            </Button>
                            <Button onClick={handleLogin} variant="outline" className="w-full mt-2">
                                <LogIn className="mr-2 h-4 w-4" /> Log In
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
          </Sheet>

          {/* User/Auth Buttons or Dropdown */}
          {!showAuthenticatedUI && !isGuestMode && (
            <div className="hidden md:flex space-x-2 ml-4">
              <Button onClick={handleSignup} variant="outline" size="sm">
                <UserPlus className="mr-2 h-4 w-4" /> Sign Up
              </Button>
              <Button onClick={handleLogin} size="sm">
                <LogIn className="mr-2 h-4 w-4" /> Log In
              </Button>
            </div>
          )}

          {/* Authenticated User Dropdown */}
          {showAuthenticatedUI && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.full_name || user?.email || ''} />
                    <AvatarFallback className="bg-brand-dark text-white text-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {isPremium ? (
                      <p className="text-xs leading-none text-green-600 flex items-center mt-1">
                        <Crown className="h-3 w-3 mr-1" /> Premium User
                      </p>
                    ) : (
                      <p className="text-xs leading-none text-blue-600 flex items-center mt-1">
                        <Diamond className="h-3 w-3 mr-1" /> Free Tier
                      </p>
                    )}
                    {(creditsRemaining !== undefined && creditsRemaining !== null) && (
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                            Credits: {creditsRemaining}
                            {!isPremium && !trialUsed && (
                                <span className="text-blue-500 ml-1">(Trial Available!)</span>
                            )}
                        </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavigationItems.map(item => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link to={item.href}>
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/pricing">
                    <Crown className="h-4 w-4 mr-2 text-yellow-500" /> Upgrade
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Guest Mode UI */}
          {isGuestMode && (
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm text-muted-foreground hidden md:inline">Guest Mode</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-500 text-white text-lg">
                        <UserRound className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Guest User</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Limited Access
                      </p>
                       {(creditsRemaining !== undefined && creditsRemaining !== null) && (
                            <p className="text-xs leading-none text-muted-foreground mt-1">
                                Credits: {creditsRemaining}
                                {!trialUsed && (
                                    <span className="text-blue-500 ml-1">(Trial Available!)</span>
                                )}
                            </p>
                        )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {guestModeItems.map(item => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href}>
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/pricing">
                       <Diamond className="h-4 w-4 mr-2 text-blue-500" /> Unlock Full Access
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignup}>
                    <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogin}>
                    <LogIn className="mr-2 h-4 w-4" /> Log In
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
