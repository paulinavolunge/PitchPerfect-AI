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

    // output_format is an ElevenLabs query parameter, not a body field.
    // mp3_44100_128 = 44.1kHz, 128kbps MP3 — the highest-quality standard
    // MP3 output (pcm formats bypass ElevenLabs' audio post-processing and
    // sound more robotic; lower-bitrate mp3 audibly degrades).
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
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
            // style 0.5 adds natural expressiveness — 0.3 was audibly
            // flatter and was the primary cause of the "robotic" feel.
            style: 0.5,
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

    // Stream the raw MP3 bytes directly to the client. Previously we
    // base64-encoded the buffer into a JSON envelope — lossless but with
    // ~33% bandwidth overhead and a chunking workaround for the V8 call
    // stack. Returning the arrayBuffer means the client can build its Blob
    // straight from response.arrayBuffer(), which is both faster and matches
    // the standard audio/mpeg transport.
    const audioBuffer = await response.arrayBuffer();
    console.log(`TTS generated: ${cleanText.length} chars → ${audioBuffer.byteLength} bytes audio`);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('TTS function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
