
import { supabase } from '@/integrations/supabase/client';

export class TranscriptionFailure extends Error {
  constructor(public category: string, public status: number | null = null) {
    super('Voice transcription failed. Please try again.');
  }
}

export const whisperTranscribe = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('Starting Whisper transcription, blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    // Validate blob
    if (audioBlob.size === 0) {
      throw new Error('Audio blob is empty');
    }

    if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
      throw new Error('Audio file too large (max 25MB)');
    }
    
    // Convert blob to base64 more efficiently
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Process in smaller chunks to avoid memory issues
    const chunkSize = 32768; // 32KB chunks
    const chunks: string[] = [];
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      const binaryString = String.fromCharCode.apply(null, Array.from(chunk));
      chunks.push(binaryString);
    }
    
    const base64Audio = btoa(chunks.join(''));
    console.log('Audio converted to base64, length:', base64Audio.length);

    // Call our Supabase Edge Function for transcription
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: { 
        audio: base64Audio,
        format: audioBlob.type || 'audio/webm'
      }
    });

    if (error) {
      const status = error.context instanceof Response ? error.context.status : null;
      throw new TranscriptionFailure(status ? 'TRANSCRIPTION_PROVIDER_FAILURE' : 'TRANSCRIPTION_REQUEST_FAILURE', status);
    }

    if (!data || typeof data.text !== 'string' || !data.text.trim()) {
      throw new TranscriptionFailure('INVALID_TRANSCRIPTION');
    }

    return data.text.trim();
  } catch (error) {
    if (error instanceof TranscriptionFailure) throw error;
    console.error('Whisper transcription failed:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error during transcription. Please check your connection.');
      } else if (error.message.includes('size') || error.message.includes('large')) {
        throw new Error('Audio file is too large. Please record a shorter message.');
      } else if (error.message.includes('format')) {
        throw new Error('Audio format not supported. Please try again.');
      }
    }
    
    throw new Error('Voice transcription failed. Please try speaking again or use text input.');
  }
};
