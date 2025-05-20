
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { useGuestMode } from "@/context/GuestModeContext";
import { Menu, UserPlus, LogIn, Home, UserRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
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

  // Add auth debugging
  useEffect(() => {
    console.log('Auth state in Navbar:', { user, isGuestMode });
  }, [user, isGuestMode]);

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

  // Handle logout with improved state cleanup
  const handleSignOut = async () => {
    try {
      await signOut();
      // Force navigation to home page to ensure state is reset
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`;
    } else if (user?.user_metadata?.name) {
      return user.user_metadata.name.charAt(0);
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '';
  };

  // Navigation items
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
  const showAuthenticatedUI = user !== null && !isGuestMode;
  
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
            <SheetContent side="left" className="sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Explore PitchPerfect AI
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {showAuthenticatedUI ? (
                  <>
                    <Link 
                      to="/"
                      className={`flex items-center py-2 px-3 rounded-md ${
                        location.pathname === '/' 
                          ? 'bg-brand-blue/10 text-brand-blue font-medium' 
                          : 'text-brand-dark hover:bg-gray-100'
                      }`}
                    >
                      <Home className="h-4 w-4 mr-2" /> Home
                    </Link>
                    {userNavigationItems.map(item => (
                      <Link 
                        key={item.name} 
                        to={item.href} 
                        className={`block py-2 px-3 rounded-md ${
                          location.pathname === item.href 
                            ? 'bg-brand-blue/10 text-brand-blue font-medium' 
                            : 'text-brand-dark hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Button variant="destructive" size="sm" onClick={handleSignOut} className="w-full mt-4">Sign Out</Button>
                  </>
                ) : isGuestMode ? (
                  <>
                    {guestModeItems.map(item => (
                      <Link 
                        key={item.name} 
                        to={item.href} 
                        className={`block py-2 px-3 rounded-md ${
                          location.pathname === item.href 
                            ? 'bg-brand-blue/10 text-brand-blue font-medium' 
                            : 'text-brand-dark hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <div className="pt-4 border-t mt-4">
                      <p className="text-sm text-brand-dark/70 mb-2">Want to save your progress?</p>
                      <Button onClick={handleSignup} className="w-full mb-2 bg-brand-blue hover:bg-brand-blue/90">
                        <UserPlus className="h-4 w-4 mr-2" /> Sign Up Free
                      </Button>
                      <Button variant="outline" onClick={handleLogin} className="w-full">
                        <LogIn className="h-4 w-4 mr-2" /> Log In
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {guestNavigationItems.map(item => (
                      <Link 
                        key={item.name} 
                        to={item.href} 
                        className={`block py-2 px-3 rounded-md ${
                          location.pathname === item.href 
                            ? 'bg-brand-blue/10 text-brand-blue font-medium' 
                            : 'text-brand-dark hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <div className="pt-4 border-t mt-4">
                      <Button onClick={handleLogin} className="w-full mb-2" variant="outline">
                        <LogIn className="h-4 w-4 mr-2" /> Log In
                      </Button>
                      <Button onClick={handleSignup} className="w-full bg-brand-blue hover:bg-brand-blue/90">
                        <UserPlus className="h-4 w-4 mr-2" /> Sign Up Free
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex items-center space-x-4 md:order-2">
          {showAuthenticatedUI ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name || "User"} />
                    <AvatarFallback className="bg-brand-blue text-white">
                      {getUserInitials() || <UserRound className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </DropdownMenuItem>
                {userNavigationItems.map(item => (
                  <DropdownMenuItem key={item.name} onClick={() => navigate(item.href)}>
                    {item.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {isGuestMode ? (
                // Guest mode navigation for desktop
                guestModeItems.map(item => (
                  <Link 
                    key={item.name} 
                    to={item.href} 
                    className={`font-medium text-sm ${
                      location.pathname === item.href 
                        ? 'text-brand-blue' 
                        : 'text-brand-dark hover:text-brand-blue'
                    } hover:underline py-2 px-3 transition duration-300 ease-in-out`}
                  >
                    {item.name}
                  </Link>
                ))
              ) : (
                // Standard unauthenticated navigation for desktop
                guestNavigationItems.map(item => (
                  <Link 
                    key={item.name} 
                    to={item.href} 
                    className={`font-medium text-sm ${
                      location.pathname === item.href 
                        ? 'text-brand-blue' 
                        : 'text-brand-dark hover:text-brand-blue'
                    } hover:underline py-2 px-3 transition duration-300 ease-in-out`}
                  >
                    {item.name}
                  </Link>
                ))
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogin}
                className="ml-2"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Log In
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSignup}
                className="bg-brand-blue hover:bg-brand-blue/90"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
