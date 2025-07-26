
import { supabase } from '@/integrations/supabase/client';
import { secureLog } from '../utils/secureLog';

export const whisperTranscribe = async (audioBlob: Blob): Promise<string> => {
  try {
    secureLog.info('Starting Whisper transcription, blob size:', audioBlob.size, 'type:', audioBlob.type);
    
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
    secureLog.info('Audio converted to base64, length:', base64Audio.length);

    // Call our Supabase Edge Function for transcription
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: { 
        audio: base64Audio,
        format: audioBlob.type || 'audio/webm'
      }
    });

    if (error) {
      secureLog.error('Supabase function error:', error);
      throw new Error(`Transcription service error: ${error.message}`);
    }

    if (!data || !data.text) {
      throw new Error('No transcription result received');
    }

          secureLog.info('Transcription successful:', data.text);
    return data.text.trim();
  } catch (error) {
    secureLog.error('Whisper transcription failed:', error);
    
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
