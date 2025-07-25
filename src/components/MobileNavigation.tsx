
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { isPricingEnabled } from '@/config/features';

export const MobileNavigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="sm:hidden">
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <Link to="/" aria-label="PitchPerfect AI Home">
          <Logo size="sm" />
        </Link>
        
        <button
          type="button"
          className="bg-white p-3 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle main menu"
        >
          <span className="sr-only">Open main menu</span>
          {isMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="px-4 pt-2 pb-3 space-y-1 bg-white shadow-lg border-t border-gray-200">
          <Link
            to="/about"
            className="block px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/compare"
            className="block px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            Compare
          </Link>
          {isPricingEnabled() && (
            <Link
              to="/pricing"
              className="block px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
          )}
          <Link
            to="/demo"
            className="block px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            Demo
          </Link>
          
          <div className="pt-4 pb-3 border-t border-gray-200 space-y-3">
            {user ? (
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="space-y-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full h-11">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full h-11 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-2 ring-green-400/20">
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
