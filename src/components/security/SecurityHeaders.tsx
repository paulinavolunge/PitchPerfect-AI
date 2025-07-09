import { useEffect } from 'react';

interface SecurityHeadersProps {
  children: React.ReactNode;
}

export const SecurityHeaders: React.FC<SecurityHeadersProps> = ({ children }) => {
  useEffect(() => {
    // Set Content Security Policy via meta tag
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.openai.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.openai.com https://*.supabase.co wss://*.supabase.co",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'"
      ].join('; ');
      document.head.appendChild(cspMeta);
    }

    // Set additional security headers via meta tags where possible
    const securityMetas = [
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-Frame-Options', content: 'DENY' },
      { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
      { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityMetas.forEach(({ httpEquiv, content }) => {
      const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.httpEquiv = httpEquiv;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    // Disable right-click in production for additional security
    const handleContextMenu = (e: MouseEvent) => {
      if (process.env.NODE_ENV === 'production') {
        e.preventDefault();
      }
    };

    // Disable certain keyboard shortcuts in production
    const handleKeyDown = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'production') {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <>{children}</>;
};

export default SecurityHeaders;