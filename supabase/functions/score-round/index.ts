import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

/** GPT-4o-mini coaching prompt — returns exactly 3 feedback items. */
const COACHING_SYSTEM = `You are an expert sales coach. Analyze the transcript of a sales roleplay practice session.
Return a JSON array of exactly 3 coaching insights — pick the 3 most impactful ones.

Each item must match this schema:
{
  "category": one of: "talk_ratio" | "objection_step" | "filler_words" | "confidence" | "pace" | "closing",
  "severity": one of: "critical" | "warning" | "info",
  "timestamp_sec": integer (approximate second in transcript where the issue occurs, or null),
  "finding_text": string (plain-English observation, ≤120 chars, no jargon),
  "why_text": string (why this matters for closing deals, ≤220 chars)
}

Guidelines:
- talk_ratio: rep/prospect speaking balance (reps should talk ~40%)
- objection_step: did rep acknowledge objection before countering?
- filler_words: "um", "uh", "like", "you know", "basically"
- confidence: hedging ("I think maybe", "kind of"), trailing off, apologies
- pace: speaking too fast or too slow
- closing: did rep ask for a clear next step or commitment?

Return ONLY the JSON array. No markdown, no explanation.`;

async function generateCoachingFeedback(
  openaiKey: string,
  transcript: string,
  durationSeconds: number,
): Promise<Array<{
  category: string;
  severity: string;
  timestamp_sec: number | null;
  finding_text: string;
  why_text: string;
}>> {
  const prompt = `Duration: ${durationSeconds}s\n\nTranscript:\n${transcript}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: COACHING_SYSTEM },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    console.error('GPT-4o-mini coaching error:', res.status, await res.text());
    return [];
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? '[]';

  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : (parsed.feedback ?? parsed.items ?? []);
    return items.slice(0, 3);
  } catch {
    console.error('Failed to parse coaching JSON:', raw);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    const { round_id, audio, user_id } = await req.json();

    if (!round_id || !audio) {
      return new Response(JSON.stringify({ error: 'round_id and audio required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch round metadata for duration (needed for coaching prompt)
    const { data: roundMeta } = await supabase
      .from('practice_sessions')
      .select('duration_seconds, user_id')
      .eq('id', round_id)
      .single();

    const durationSeconds = roundMeta?.duration_seconds ?? 0;
    const resolvedUserId = user_id ?? roundMeta?.user_id;

    // ── Whisper transcription ────────────────────────────────────────
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

    const whisperData = JSON.parse(rawText);
    const transcript: string = whisperData.text ?? '';

    if (isHallucination(transcript)) {
      await markRound(supabase, round_id, 'failed', 'hallucinated_output', transcript);
      return new Response(JSON.stringify({ status: 'failed', reason: 'hallucinated_output' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (transcript.trim().length < 20) {
      await markRound(supabase, round_id, 'failed', 'no_speech_detected', transcript);
      return new Response(JSON.stringify({ status: 'failed', reason: 'no_speech_detected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as processing while we generate coaching feedback
    await markRound(supabase, round_id, 'processing', '', transcript);

    // ── GPT-4o-mini coaching (non-blocking on error) ─────────────────
    const coachingItems = await generateCoachingFeedback(OPENAI_API_KEY, transcript, durationSeconds);

    if (coachingItems.length > 0 && resolvedUserId) {
      const rows = coachingItems.map((item) => ({
        round_id,
        user_id: resolvedUserId,
        category: item.category,
        severity: item.severity,
        timestamp_sec: item.timestamp_sec ?? null,
        finding_text: String(item.finding_text ?? '').slice(0, 200),
        why_text: String(item.why_text ?? '').slice(0, 400),
      }));

      const { error: insertErr } = await supabase.from('coaching_feedback').insert(rows);
      if (insertErr) console.error('coaching_feedback insert error:', insertErr);
    }

    return new Response(JSON.stringify({ status: 'processing', transcript, coaching: coachingItems.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('score-round error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
