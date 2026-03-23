import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const tryAuth = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { audio, format } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing voice transcription for:', callerId);

    // Convert base64 to blob for OpenAI API
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: format }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

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