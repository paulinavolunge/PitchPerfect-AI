
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogIn, LogOut, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isPremium } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleAuthAction = () => {
    if (user) {
      // User is logged in, show dropdown
    } else {
      // User is not logged in, redirect to login
      navigate('/login');
    }
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 border-b transition-all duration-300",
      isScrolled ? "py-1" : "py-2"
    )}>
      <div className="container mx-auto px-4 flex justify-between items-center h-10">
        <Logo 
          size={isScrolled ? "sm" : "md"} 
          className="flex-grow-0 flex-shrink-0 self-center" 
        />
        
        {!isMobile ? (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`nav-link ${isActive('/') ? 'text-brand-green font-medium' : ''}`}>
              Home
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'text-brand-green font-medium' : ''}`}>
              Dashboard
            </Link>
            <Link to="/practice" className={`nav-link ${isActive('/practice') ? 'text-brand-green font-medium' : ''}`}>
              Practice
            </Link>
            <Link to="/roleplay" className={`nav-link ${isActive('/roleplay') ? 'text-brand-green font-medium' : ''}`}>
              {isPremium ? 'Roleplay' : <span className="flex items-center">Roleplay <span className="ml-1 text-xs bg-brand-green/20 text-brand-green px-1 rounded">PRO</span></span>}
            </Link>
            <Link to="/tips" className={`nav-link ${isActive('/tips') ? 'text-brand-green font-medium' : ''}`}>
              AI Tips
            </Link>
            <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'text-brand-green font-medium' : ''}`}>
              Pricing
            </Link>
            {!isPremium && user && (
              <Link to="/subscription" className="nav-link text-brand-green font-medium">
                Upgrade
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="ml-2"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex-shrink-0"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        )}
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User size={20} />
                <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                Dashboard
              </DropdownMenuItem>
              {isPremium && (
                <DropdownMenuItem className="flex items-center">
                  <span className="mr-2">Premium</span>
                  <span className="ml-auto text-xs bg-brand-green/20 text-brand-green px-1 rounded">PRO</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate('/subscription')}>
                {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button className="btn-primary animate-fade-in" onClick={() => navigate('/login')}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
      
      {isMobile && isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-black/90 border-b shadow-lg animate-slide-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link 
              to="/" 
              className={`p-2 rounded-lg ${isActive('/') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className={`p-2 rounded-lg ${isActive('/dashboard') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/practice" 
              className={`p-2 rounded-lg ${isActive('/practice') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Practice
            </Link>
            <Link 
              to="/roleplay" 
              className={`p-2 rounded-lg ${isActive('/roleplay') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {isPremium ? 'Roleplay' : <span className="flex items-center justify-between">Roleplay <span className="ml-1 text-xs bg-brand-green/20 text-brand-green px-1 rounded">PRO</span></span>}
            </Link>
            <Link 
              to="/tips" 
              className={`p-2 rounded-lg ${isActive('/tips') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              AI Tips
            </Link>
            <Link 
              to="/pricing" 
              className={`p-2 rounded-lg ${isActive('/pricing') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            {!isPremium && user && (
              <Link 
                to="/subscription" 
                className="p-2 rounded-lg bg-brand-green/10 text-brand-green font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Upgrade to Premium
              </Link>
            )}
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-sm">Theme</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>
            {user ? (
              <Button variant="outline" className="w-full mt-2" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button className="btn-primary w-full mt-2" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
