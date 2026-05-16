import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Whisper returns these verbatim for near-silent audio on certain hardware.
const WHISPER_HALLUCINATION_DENYLIST = new Set([
  "thanks for watching",
  "subtitles by amara",
  "bye!",
  "legenda adriana zanotto",
  "subtitles by the amara.org community",
]);

function isHallucination(text: string): boolean {
  return WHISPER_HALLUCINATION_DENYLIST.has(text.trim().toLowerCase());
}

async function markRound(
  supabase: ReturnType<typeof createClient>,
  roundId: string,
  status: string,
  reason: string,
  transcript?: string,
) {
  await supabase
    .from('practice_sessions')
    .update({ status, reason, ...(transcript !== undefined ? { transcript } : {}) })
    .eq('id', roundId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { round_id, audio } = await req.json();

    if (!round_id || !audio) {
      return new Response(JSON.stringify({ error: 'round_id and audio required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 audio
    const audioBuffer = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    // HTTP 200 with empty body
    const rawText = await whisperRes.text();
    if (!rawText || rawText.trim().length === 0) {
      await markRound(supabase, round_id, 'failed', 'empty_transcript');
      return new Response(JSON.stringify({ status: 'failed', reason: 'empty_transcript' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!whisperRes.ok) {
      await markRound(supabase, round_id, 'failed', 'processing_failed');
      return new Response(JSON.stringify({ status: 'failed', reason: 'processing_failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(rawText);
    const transcript: string = data.text ?? '';

    // Hallucination check
    if (isHallucination(transcript)) {
      await markRound(supabase, round_id, 'failed', 'hallucinated_output', transcript);
      return new Response(JSON.stringify({ status: 'failed', reason: 'hallucinated_output' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transcript too short
    if (transcript.trim().length < 20) {
      await markRound(supabase, round_id, 'failed', 'no_speech_detected', transcript);
      return new Response(JSON.stringify({ status: 'failed', reason: 'no_speech_detected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Valid transcript — mark as processing (scoring happens in pitch-analysis)
    await markRound(supabase, round_id, 'processing', '', transcript);

    return new Response(JSON.stringify({ status: 'processing', transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('score-round error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
