import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const verifyAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) { console.log('No auth token, guest access'); return null; }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (token === anonKey) {
      console.log('Guest user access via anon key');
      return null;
    }
    console.log('Allowing unauthenticated access'); return null;
  }

  return user;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await verifyAuth(req);
    console.log('TTS request from:', user ? `user ${user.id}` : 'guest');

    const { text, voiceId } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid text parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate to prevent abuse — prospect responses are short
    const cleanText = text.slice(0, 500);

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'TTS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default voice: Roger (CwhRBWXzGAHq8TQ4Fs17) — natural, professional
    const selectedVoiceId = voiceId || 'CwhRBWXzGAHq8TQ4Fs17';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert audio stream to base64 in chunks to avoid call stack overflow.
    // The spread operator (...new Uint8Array(largeBuffer)) crashes on audio
    // responses >~30KB because it passes every byte as a function argument.
    const audioBuffer = await response.arrayBuffer();
    const uint8 = new Uint8Array(audioBuffer);
    const chunkSize = 32768; // 32KB chunks
    const parts: string[] = [];
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, i + chunkSize);
      parts.push(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    const base64Audio = btoa(parts.join(''));

    console.log(`TTS generated: ${cleanText.length} chars → ${audioBuffer.byteLength} bytes audio → ${base64Audio.length} base64 chars`);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('TTS function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
