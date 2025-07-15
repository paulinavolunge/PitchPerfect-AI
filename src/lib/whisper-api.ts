
import { supabase } from '@/integrations/supabase/client';

export const whisperTranscribe = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('Starting Whisper transcription, blob size:', audioBlob.size);
    
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    
    // Process in chunks to avoid memory issues
    const chunkSize = 32768;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binaryString);
    console.log('Audio converted to base64, length:', base64Audio.length);

    // Call our Supabase Edge Function for transcription
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: { audio: base64Audio }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Transcription service error: ${error.message}`);
    }

    if (!data || !data.text) {
      throw new Error('No transcription result received');
    }

    console.log('Transcription successful:', data.text);
    return data.text;
  } catch (error) {
    console.error('Whisper transcription failed:', error);
    
    // Fallback message
    throw new Error('Voice transcription failed. Please try speaking again or use text input.');
  }
};
