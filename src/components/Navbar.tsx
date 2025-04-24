import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

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

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b transition-all duration-300",
      isScrolled ? "py-2" : "py-3"
    )}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Logo size={isScrolled ? "md" : "lg"} />
        
        {!isMobile ? (
          <div className="hidden md:flex items-center gap-8 animate-fade-in">
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
              Roleplay
            </Link>
            <Link to="/tips" className={`nav-link ${isActive('/tips') ? 'text-brand-green font-medium' : ''}`}>
              AI Tips
            </Link>
            <Link to="/subscription" className={`nav-link ${isActive('/subscription') ? 'text-brand-green font-medium' : ''}`}>
              Pricing
            </Link>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        )}
        
        <Button className="btn-primary hidden md:flex animate-fade-in">Get Started</Button>
      </div>
      
      {isMobile && isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg animate-slide-in">
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
              Roleplay
            </Link>
            <Link 
              to="/tips" 
              className={`p-2 rounded-lg ${isActive('/tips') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              AI Tips
            </Link>
            <Link 
              to="/subscription" 
              className={`p-2 rounded-lg ${isActive('/subscription') ? 'bg-brand-blue/20 text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Button className="btn-primary w-full mt-2" onClick={() => setIsMenuOpen(false)}>
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
