
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { PrimaryButton } from './ui/primary-button';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" aria-label="PitchPerfect AI Home">
                <Logo size="sm" />
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/about')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                About
              </Link>
              <Link
                to="/compare"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/compare')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Compare
              </Link>
              <Link
                to="/pricing"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/pricing')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Pricing
              </Link>
              <Link
                to="/demo"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/demo')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Demo
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <PrimaryButton variant="secondary" size="sm">
                    Dashboard
                  </PrimaryButton>
                </Link>
                <div className="relative">
                  {/* User menu would go here */}
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <PrimaryButton variant="secondary" size="sm">
                    Log In
                  </PrimaryButton>
                </Link>
                <Link to="/signup">
                  <PrimaryButton variant="primary" size="sm">
                    Sign Up Free
                  </PrimaryButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
