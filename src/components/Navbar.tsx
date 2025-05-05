import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Navbar: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    theme,
    setTheme
  } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Navigation items
  const userNavigationItems = [{
    name: 'Dashboard',
    href: '/dashboard'
  }, {
    name: 'Practice',
    href: '/practice'
  }, {
    name: 'Role Play',
    href: '/roleplay'
  }, {
    name: 'Progress',
    href: '/progress'
  }, {
    name: 'Call Recordings',
    href: '/call-recordings'
  }, {
    name: 'Tips',
    href: '/tips'
  }];
  const guestNavigationItems = [{
    name: 'About',
    href: '/about'
  }, {
    name: 'Compare',
    href: '/compare'
  }, {
    name: 'Pricing',
    href: '/pricing'
  }, {
    name: 'Demo',
    href: '/demo'
  }];
  return <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container max-w-screen-xl flex flex-wrap items-center justify-between py-3 mx-auto">
        <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-brand-dark">
            PitchPerfect AI
          </span>
        </Link>
        
        {/* Theme Toggle */}
        <button onClick={toggleTheme} aria-label="Toggle theme" className="focus:outline-none">
          {theme === "light" ? <Moon className="h-5 w-5 text-brand-dark" /> : <Sun className="h-5 w-5 text-white" />}
        </button>
        
        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm" className="p-0">
              <Menu className="h-5 w-5 text-brand-dark" />
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
              {user ? <>
                  {userNavigationItems.map(item => <Link key={item.name} to={item.href} className="block py-2 text-brand-dark hover:text-brand-blue">{item.name}</Link>)}
                  <Button variant="destructive" size="sm" onClick={signOut} className="w-full">Sign Out</Button>
                </> : <>
                  {guestNavigationItems.map(item => <Link key={item.name} to={item.href} className="block py-2 text-brand-dark hover:text-brand-blue">{item.name}</Link>)}
                  <Link to="/login" className="block py-2 text-brand-dark hover:text-brand-blue">Login</Link>
                  <Link to="/signup" className="block py-2 text-brand-dark hover:text-brand-blue">Sign Up</Link>
                </>}
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex items-center space-x-4">
          {user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name} />
                    <AvatarFallback>{user?.user_metadata?.first_name?.charAt(0)}{user?.user_metadata?.last_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavigationItems.map(item => <DropdownMenuItem key={item.name} onClick={() => navigate(item.href)}>{item.name}</DropdownMenuItem>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <>
              {guestNavigationItems.map(item => <Link key={item.name} to={item.href} className="text-lg text-brand-dark hover:text-brand-blue hover:underline py-2 px-6 rounded-lg transition duration-300 ease-in-out\\<a href=\"#\" class=\"text-lg text-brand-dark hover:text-brand-blue hover:underline py-2 px-6 rounded-lg transition duration-300 ease-in-out\">Link Text</a>\n">{item.name}</Link>)}
              <Link to="/login" className="text-sm text-brand-dark hover:text-brand-blue">Login</Link>
              <Link to="/signup" className="text-sm text-brand-dark hover:text-brand-blue">Sign Up</Link>
            </>}
        </div>
      </div>
    </nav>;
};
export default Navbar;