
import React from 'react';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import Footer from './Footer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Desktop Navigation */}
      <div className="hidden sm:block">
        <Navigation />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Main Content */}
      <main className={`flex-grow w-full ${isMobile ? 'pb-16' : ''}`}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
      
      {/* Footer - only show on desktop */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </div>
  );
};
