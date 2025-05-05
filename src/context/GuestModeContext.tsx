
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GuestModeContextType {
  isGuestMode: boolean;
  startGuestMode: () => void;
  endGuestMode: () => void;
  guestSessionId: string | null;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
}

export function GuestModeProvider({ children }: { children: React.ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

  // Check localStorage on initial load
  useEffect(() => {
    const storedGuestMode = localStorage.getItem('guestMode');
    const storedSessionId = localStorage.getItem('guestSessionId');
    
    if (storedGuestMode === 'true' && storedSessionId) {
      setIsGuestMode(true);
      setGuestSessionId(storedSessionId);
    }
  }, []);

  const startGuestMode = () => {
    // Generate a unique session ID
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setGuestSessionId(sessionId);
    setIsGuestMode(true);
    
    // Store in localStorage to persist across page refreshes
    localStorage.setItem('guestMode', 'true');
    localStorage.setItem('guestSessionId', sessionId);
  };

  const endGuestMode = () => {
    setIsGuestMode(false);
    setGuestSessionId(null);
    
    // Clear from localStorage
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestSessionId');
  };

  return (
    <GuestModeContext.Provider value={{ isGuestMode, startGuestMode, endGuestMode, guestSessionId }}>
      {children}
    </GuestModeContext.Provider>
  );
}
