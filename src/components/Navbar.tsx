
import React from 'react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-brand-dark hover:text-brand-green transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="text-brand-dark hover:text-brand-green transition-colors">
            Dashboard
          </Link>
          <Link to="/practice" className="text-brand-dark hover:text-brand-green transition-colors">
            Practice
          </Link>
          <Link to="/roleplay" className="text-brand-dark hover:text-brand-green transition-colors">
            Roleplay
          </Link>
          <Link to="/tips" className="text-brand-dark hover:text-brand-green transition-colors">
            AI Tips
          </Link>
        </div>
        
        <Button className="btn-primary">Get Started</Button>
      </div>
    </nav>
  );
};

export default Navbar;
