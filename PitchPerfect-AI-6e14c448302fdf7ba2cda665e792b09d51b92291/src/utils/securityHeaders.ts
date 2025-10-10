import { SecurityMonitoringService } from '@/services/SecurityMonitoringService';

// Security headers configuration
export const SECURITY_HEADERS = {
  // Changed from DENY to SAMEORIGIN to allow Lovable editor iframe
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff', 
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    // Note: 'unsafe-inline' required for Vite HMR and React inline styles in dev mode
    // Note: 'unsafe-eval' required for some dependencies (Stripe, Supabase, analytics)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://cdn.gpteng.co https://www.youtube.com https://youtube.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https: wss: https://*.supabase.co",
    "media-src 'self' blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'self' https://www.youtube.com https://youtube.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'", 
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
    "report-uri /api/csp-violation-report"
  ].join('; ')
} as const;

// Initialize CSP violation reporting
export function initCSPViolationReporting() {
  // Add CSP violation event listener
  document.addEventListener('securitypolicyviolation', (e) => {
    SecurityMonitoringService.handleCSPViolation({
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
      originalPolicy: e.originalPolicy
    });
  });
}

// Apply only meta-compatible security headers (avoid CSP in meta; served via Netlify headers)
export function applySecurityMetaTags() {
  const head = document.head;

  // Referrer Policy (this one works in meta tags)
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  head.appendChild(referrerMeta);
}

// Initialize all security measures
export function initializeSecurity() {
  applySecurityMetaTags();
  initCSPViolationReporting();
  
  // Log security initialization
  SecurityMonitoringService.logSecurityEvent('security_headers_initialized', {
    csp_enabled: true,
    violation_reporting: true,
    timestamp: new Date().toISOString()
  });
}