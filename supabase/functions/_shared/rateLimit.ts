// In-memory per-IP rate limiter for edge functions.
// Note: per-instance state — adequate as cost-abuse mitigation, not a hard guarantee.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Token bucket per key. windowMs = window length, max = max requests per window.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }
  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt };
}

export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
) {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded. Please slow down and try again shortly.",
      code: "RATE_LIMITED",
      retryAfterSeconds: Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
      },
    },
  );
}
