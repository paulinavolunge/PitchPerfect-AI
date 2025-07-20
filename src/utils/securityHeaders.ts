import { SecurityMonitoringService } from '@/services/SecurityMonitoringService';

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff', 
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'microphone=(self), camera=(), geolocation=(), payment=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://cdn.gpteng.co https://www.youtube.com https://youtube.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src 'self' https://www.youtube.com https://youtube.com",
    "frame-ancestors 'self'",
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

// Apply security headers to meta tags (for client-side enforcement)
export function applySecurityMetaTags() {
  const head = document.head;
  
  // CSP meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = SECURITY_HEADERS['Content-Security-Policy'];
  head.appendChild(cspMeta);
  
  // X-Frame-Options
  const frameMeta = document.createElement('meta');
  frameMeta.httpEquiv = 'X-Frame-Options';
  frameMeta.content = SECURITY_HEADERS['X-Frame-Options'];
  head.appendChild(frameMeta);
  
  // Referrer Policy
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