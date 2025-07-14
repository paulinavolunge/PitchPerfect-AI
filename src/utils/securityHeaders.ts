/**
 * Security headers configuration for enhanced protection
 */

export const getSecurityHeaders = () => ({
  // Prevent page from being embedded in frames (clickjacking protection)
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy - strict but functional
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://ggpodadyycvmmxifqwlp.supabase.co wss://ggpodadyycvmmxifqwlp.supabase.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ].join('; '),
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'microphone=(self)',
    'camera=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', ')
});

/**
 * Apply security headers to responses in edge functions
 */
export const applySecurityHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

/**
 * CORS headers with security considerations
 */
export const getSecureCorsHeaders = (allowedOrigin: string = '*') => ({
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'x-requested-with'
  ].join(', '),
  'Access-Control-Max-Age': '86400', // 24 hours
  'Access-Control-Allow-Credentials': 'true'
});