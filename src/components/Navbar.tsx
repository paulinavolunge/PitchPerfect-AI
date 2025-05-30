
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { useGuestMode } from "@/context/GuestModeContext";
import { Menu, UserPlus, LogIn, Home, UserRound, Crown, Diamond } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';

const Navbar: React.FC = () => {
  const { user, signOut, isPremium, creditsRemaining, trialUsed } = useAuth();
  const { isGuestMode, endGuestMode } = useGuestMode();
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
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-brand-dark">PitchPerfect AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                {showAuthenticatedUI ? (
                  <>
                    {mainNavItems.map((item) => (
                      <NavigationMenuItem key={item.name}>
                        <Link
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.href
                              ? 'text-brand-green bg-brand-green/10'
                              : 'text-brand-dark hover:text-brand-green hover:bg-brand-green/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </>
                ) : isGuestMode ? (
                  <>
                    {guestModeItems.map((item) => (
                      <NavigationMenuItem key={item.name}>
                        <Link
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.href
                              ? 'text-brand-green bg-brand-green/10'
                              : 'text-brand-dark hover:text-brand-green hover:bg-brand-green/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </>
                ) : (
                  <>
                    {guestNavigationItems.map((item) => (
                      <NavigationMenuItem key={item.name}>
                        <Link
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.href
                              ? 'text-brand-green bg-brand-green/10'
                              : 'text-brand-dark hover:text-brand-green hover:bg-brand-green/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side - Auth/User menu */}
          <div className="flex items-center space-x-4">
            {showAuthenticatedUI ? (
              <>
                {/* Premium Badge */}
                {isPremium && (
                  <div className="hidden sm:flex items-center space-x-1 px-2 py-1 bg-amber-100 rounded-full">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">Premium</span>
                  </div>
                )}

                {/* Credits display */}
                {!isPremium && (
                  <div className="hidden sm:flex items-center space-x-1 text-sm text-brand-dark/70">
                    <Diamond className="h-4 w-4" />
                    <span>{creditsRemaining} credits</span>
                  </div>
                )}

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                        <AvatarFallback className="bg-brand-green text-white text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.user_metadata?.name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/progress" className="cursor-pointer">
                        <UserRound className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {!isPremium && (
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="cursor-pointer">
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade to Premium
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogin}
                  className="hidden sm:flex"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={handleSignup}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up Free
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>
                    Access all features and pages
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  {showAuthenticatedUI ? (
                    <>
                      {userNavigationItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.href
                              ? 'text-brand-green bg-brand-green/10'
                              : 'text-brand-dark hover:text-brand-green hover:bg-brand-green/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t pt-4 mt-4">
                        <Button
                          variant="outline"
                          onClick={handleSignOut}
                          className="w-full"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </>
                  ) : isGuestMode ? (
                    <>
                      {guestModeItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.href
                              ? 'text-brand-green bg-brand-green/10'
                              : 'text-brand-dark hover:text-brand-green hover:bg-brand-green/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t pt-4 mt-4 space-y-2">
                        <Button
                          variant="outline"
                          onClick={handleLogin}
                          className="w-full"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Log In
                        </Button>
                        <Button
                          onClick={handleSignup}
                          className="w-full bg-brand-green hover:bg-brand-green/90"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Sign Up Free
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {guestNavigationItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            location.pathname === item.href
                              ? 'text-brand-green bg-brand-green/10'
                              : 'text-brand-dark hover:text-brand-green hover:bg-brand-green/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t pt-4 mt-4 space-y-2">
                        <Button
                          variant="outline"
                          onClick={handleLogin}
                          className="w-full"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Log In
                        </Button>
                        <Button
                          onClick={handleSignup}
                          className="w-full bg-brand-green hover:bg-brand-green/90"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Sign Up Free
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
