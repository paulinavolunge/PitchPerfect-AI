import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, getClientIp, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const tryAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  // Fast path: guests present the anon key itself as the bearer token. Skip the
  // auth-server round trip for them (~100-500ms saved per request).
  if (token === Deno.env.get('SUPABASE_ANON_KEY')) return null;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try authentication (optional — guests are allowed)
    const user = await tryAuth(req);
    const callerId = user?.id ?? 'guest';
    console.log('Voice transcription request from:', callerId);

    // Per-IP rate limit to cap Whisper API spend by unauthenticated callers.
    const ip = getClientIp(req);
    const rl = checkRateLimit(`stt:${user?.id ?? `ip:${ip}`}`, user ? 60 : 15, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { audio, format } = await req.json();

    if (!audio || typeof audio !== 'string') {
      throw new Error('No audio data provided');
    }

    // Cap base64 payload to ~8 MB (≈6 MB raw audio) to prevent abuse.
    const MAX_AUDIO_B64 = 8 * 1024 * 1024;
    if (audio.length > MAX_AUDIO_B64) {
      return new Response(
        JSON.stringify({ error: 'Audio payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing voice transcription for:', callerId);

    // Convert base64 to blob for OpenAI API
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: format }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // One automatic retry with short backoff on transient OpenAI failures
    // (429 rate-limit / 5xx / network error). Timeouts are not retried.
    // A 429 caused by billing/quota exhaustion (`insufficient_quota`) is not
    // transient, so it fails fast without a retry.
    const RETRYABLE_STATUS = (s: number) => s === 429 || s >= 500;
    const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';
    const isQuotaError = async (res: Response): Promise<boolean> => {
      try { return /insufficient_quota/i.test(await res.clone().text()); }
      catch { return false; }
    };
    const callWhisper = async (): Promise<Response> => {
      const attemptController = new AbortController();
      const attemptTimeout = setTimeout(() => attemptController.abort(), 25_000);
      try {
        return await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
          signal: attemptController.signal,
        });
      } finally {
        clearTimeout(attemptTimeout);
      }
    };

    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1_500));
      try {
        const res = await callWhisper();
        if (res.ok) { response = res; break; }
        if (res.status === 429 && await isQuotaError(res)) {
          console.warn('[voice-to-text] OpenAI billing/quota exhausted — failing fast, no retry');
          response = res; break;
        }
        if (!RETRYABLE_STATUS(res.status)) { response = res; break; }
        console.warn(`[voice-to-text] OpenAI ${res.status} on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
        response = res;
      } catch (error) {
        if (isAbort(error)) { response = null; break; }
        console.warn(`[voice-to-text] OpenAI network error on attempt ${attempt + 1} — ${attempt === 0 ? 'retrying once' : 'giving up'}`);
        response = null;
      }
    }

    if (!response) {
      throw new Error('Transcription request timed out');
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Transcription successful for:', callerId);

    return new Response(JSON.stringify({ 
      text: data.text,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-to-text function:', error);
    
    const errMsg = (error as Error).message ?? '';
    return new Response(JSON.stringify({
      error: errMsg,
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});