import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EnhancedSecurityService } from '@/services/EnhancedSecurityService';

interface SecurityEvent {
  type: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityMonitor = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    if (!user?.id) return false;

    try {
      return await EnhancedSecurityService.logSecurityEvent(
        event.type,
        {
          ...event.details,
          severity: event.severity || 'medium',
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href
        },
        user.id
      );
    } catch (error) {
      console.error('Failed to log security event:', error);
      return false;
    }
  }, [user?.id]);

  // Monitor for suspicious activities
  useEffect(() => {
    if (!user?.id) return;

    // Monitor for rapid page navigation (potential bot behavior)
    let navigationCount = 0;
    const navigationWindow = 10000; // 10 seconds
    let navigationTimer: NodeJS.Timeout;

    const resetNavigationCount = () => {
      navigationCount = 0;
    };

    const handleNavigation = () => {
      navigationCount++;
      
      if (navigationCount > 10) {
        logSecurityEvent({
          type: 'suspicious_navigation',
          details: { 
            navigation_count: navigationCount,
            window_ms: navigationWindow
          },
          severity: 'medium'
        });
      }

      clearTimeout(navigationTimer);
      navigationTimer = setTimeout(resetNavigationCount, navigationWindow);
    };

    // Monitor for console access attempts
    const handleConsoleAccess = () => {
      logSecurityEvent({
        type: 'developer_console_access',
        details: { 
          page: window.location.pathname
        },
        severity: 'low'
      });
    };

    // Monitor for potential XSS attempts via URL
    const checkURLForXSS = () => {
      const url = window.location.href;
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /on\w+\s*=/i
      ];

      if (xssPatterns.some(pattern => pattern.test(url))) {
        logSecurityEvent({
          type: 'potential_xss_in_url',
          details: { 
            url: url.substring(0, 200) // Limit URL length for security
          },
          severity: 'high'
        });
      }
    };

    // Monitor for clipboard access (potential data exfiltration)
    const handleClipboardAccess = () => {
      logSecurityEvent({
        type: 'clipboard_access',
        details: { 
          page: window.location.pathname
        },
        severity: 'low'
      });
    };

    // Set up event listeners
    window.addEventListener('beforeunload', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    
    // Monitor for developer tools
    let devtools = { open: false };
    const threshold = 160;
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          handleConsoleAccess();
        }
      } else {
        devtools.open = false;
      }
    }, 5000);

    // Check URL on load
    checkURLForXSS();

    // Monitor clipboard events
    document.addEventListener('paste', handleClipboardAccess);
    document.addEventListener('copy', handleClipboardAccess);

    return () => {
      window.removeEventListener('beforeunload', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      document.removeEventListener('paste', handleClipboardAccess);
      document.removeEventListener('copy', handleClipboardAccess);
      clearTimeout(navigationTimer);
    };
  }, [user?.id, logSecurityEvent]);

  return {
    logSecurityEvent
  };
};

export default useSecurityMonitor;