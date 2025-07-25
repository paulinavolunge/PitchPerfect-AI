
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Mic, BarChart, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const MobileNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Don't show on desktop or on login, signup, or other auth pages
  const authPages = ['/login', '/signup', '/password-reset', '/update-password'];
  if (!isMobile || authPages.includes(location.pathname) || !user) {
    return null;
  }
  
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      label: 'Practice',
      icon: Mic,
      path: '/roleplay',
      active: location.pathname === '/roleplay' || location.pathname === '/practice'
    },
    {
      label: 'Progress',
      icon: BarChart,
      path: '/progress',
      active: location.pathname === '/progress'
    },
    {
      label: 'History',
      icon: FileText,
      path: '/call-recordings',
      active: location.pathname === '/call-recordings' || location.pathname === '/recordings'
    },
    {
      label: 'Profile',
      icon: User,
      path: '/progress',
      active: location.pathname === '/progress' || location.pathname === '/profile'
    }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 rounded-lg transition-colors touch-manipulation min-h-[56px]",
              item.active 
                ? "text-[#008D95] bg-[#008D95]/10" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <item.icon size={22} className={cn(
              "mb-1",
              item.active ? "text-[#008D95]" : "text-gray-500"
            )} />
            <span className="text-xs font-medium leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNavBar;
