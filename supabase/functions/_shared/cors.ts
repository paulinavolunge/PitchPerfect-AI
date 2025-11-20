const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim());

export const corsHeaders = (origin?: string) => {
  // Allow wildcard for demo/public endpoints, otherwise validate origin
  const allowed = origin && ORIGINS.includes(origin) ? origin : (ORIGINS.length > 0 ? ORIGINS[0] : "*");
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
};
