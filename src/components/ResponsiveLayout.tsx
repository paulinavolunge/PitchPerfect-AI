
import React from 'react';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import Footer from './Footer';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="hidden sm:block">
        <Navigation />
      </div>
      <MobileNavigation />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};
