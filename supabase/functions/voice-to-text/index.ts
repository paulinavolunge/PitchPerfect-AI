
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Determine appropriate file extension and MIME type
function getAudioFormat(format?: string, binaryData?: Uint8Array) {
  // Default to webm if no format specified
  let mimeType = 'audio/webm';
  let extension = 'webm';
  
  if (format) {
    if (format.includes('mp4') || format.includes('m4a')) {
      mimeType = 'audio/mp4';
      extension = 'mp4';
    } else if (format.includes('wav')) {
      mimeType = 'audio/wav';
      extension = 'wav';
    } else if (format.includes('mpeg') || format.includes('mp3')) {
      mimeType = 'audio/mpeg';
      extension = 'mp3';
    } else if (format.includes('ogg')) {
      mimeType = 'audio/ogg';
      extension = 'ogg';
    }
  }
  
  // Try to detect format from binary data if available
  if (binaryData && binaryData.length > 12) {
    const header = Array.from(binaryData.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (header.startsWith('1a45dfa3')) {
      mimeType = 'audio/webm';
      extension = 'webm';
    } else if (header.includes('667479706d703432') || header.includes('667479706d703431')) {
      mimeType = 'audio/mp4';
      extension = 'mp4';
    } else if (header.startsWith('52494646') && header.includes('57415645')) {
      mimeType = 'audio/wav';
      extension = 'wav';
    } else if (header.startsWith('494433') || header.startsWith('fff3') || header.startsWith('fffb')) {
      mimeType = 'audio/mpeg';
      extension = 'mp3';
    }
  }
  
  return { mimeType, extension };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎙 Voice-to-text function called');
    
    const { audio, format } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('📊 Audio data length:', audio.length, 'Format:', format);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    console.log('🔄 Processed audio, size:', binaryAudio.length);
    
    // Determine the best audio format
    const { mimeType, extension } = getAudioFormat(format, binaryAudio);
    console.log('🎵 Detected format:', mimeType, 'Extension:', extension);
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: mimeType })
    formData.append('file', blob, `audio.${extension}`)
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')
    formData.append('response_format', 'json')

    console.log('📡 Sending to OpenAI Whisper API...');

    // Send to OpenAI with retry logic
    let response;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          break;
        } else if (response.status === 429 && attempt < maxAttempts - 1) {
          // Rate limited, wait and retry
          console.log('🔄 Rate limited, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
          attempt++;
          continue;
        } else {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }
      } catch (fetchError) {
        if (attempt === maxAttempts - 1) {
          throw fetchError;
        }
        console.log(`🔄 Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempt++;
      }
    }

    console.log('📡 OpenAI response status:', response?.status);

    if (!response || !response.ok) {
      const errorText = await response?.text() || 'Unknown error';
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response?.status || 'Unknown'} - ${errorText}`)
    }

    const result = await response.json()
    
    if (!result.text || result.text.trim().length === 0) {
      console.warn('⚠️ Empty transcription result');
      throw new Error('No speech detected in audio');
    }
    
    console.log('✅ Transcription successful:', result.text);

    return new Response(
      JSON.stringify({ text: result.text.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Error in voice-to-text function:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Voice transcription failed';
    if (error.message.includes('No audio data')) {
      errorMessage = 'No audio data received';
    } else if (error.message.includes('OPENAI_API_KEY')) {
      errorMessage = 'Service configuration error';
    } else if (error.message.includes('OpenAI API error')) {
      errorMessage = 'Transcription service temporarily unavailable';
    } else if (error.message.includes('No speech detected')) {
      errorMessage = 'No speech detected in audio';
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
