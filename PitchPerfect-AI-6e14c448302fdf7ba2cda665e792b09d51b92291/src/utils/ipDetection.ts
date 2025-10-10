/**
 * Secure IP detection utilities
 * Replaces hardcoded localhost values with proper IP detection
 */

export interface IPInfo {
  ip: string;
  isPrivate: boolean;
  isValid: boolean;
  source: string;
}

/**
 * Extract real client IP from request headers in order of preference
 */
export const extractClientIP = (request: Request): IPInfo => {
  // Try different header sources in order of preference
  const ipSources = [
    { header: 'cf-connecting-ip', source: 'cloudflare' },
    { header: 'x-forwarded-for', source: 'proxy' },
    { header: 'x-real-ip', source: 'proxy' },
    { header: 'x-client-ip', source: 'proxy' },
  ];

  for (const { header, source } of ipSources) {
    const headerValue = request.headers.get(header);
    if (headerValue) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ip = headerValue.split(',')[0]?.trim();
      if (ip && isValidIP(ip)) {
        return {
          ip,
          isPrivate: isPrivateIP(ip),
          isValid: true,
          source
        };
      }
    }
  }

  return {
    ip: 'unknown',
    isPrivate: false,
    isValid: false,
    source: 'none'
  };
};

/**
 * Validate IP address format
 */
export const isValidIP = (ip: string): boolean => {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  // IPv6 validation (basic)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
};

/**
 * Check if IP is in private range
 */
export const isPrivateIP = (ip: string): boolean => {
  if (!isValidIP(ip)) return false;

  const parts = ip.split('.').map(Number);
  
  // IPv4 private ranges
  return (
    // 10.0.0.0/8
    parts[0] === 10 ||
    // 172.16.0.0/12
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    // 192.168.0.0/16
    (parts[0] === 192 && parts[1] === 168) ||
    // 127.0.0.0/8 (localhost)
    parts[0] === 127
  );
};

/**
 * Generate a secure fallback identifier when IP is not available
 */
export const generateSecureFallbackId = (): string => {
  return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};