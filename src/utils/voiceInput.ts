
import { whisperTranscribe } from '../lib/whisper-api';

const nativeSpeechRecognition = async (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error('Speech recognition failed: ' + event.error));
      };

      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

export const processVoiceInput = async (audioBlob: Blob) => {
  if (typeof (window as any).webkitSpeechRecognition !== 'undefined') {
    return await nativeSpeechRecognition(audioBlob);
  } else {
    return await whisperTranscribe(audioBlob); // Whisper API fallback
  }
};
