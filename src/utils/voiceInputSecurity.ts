
import { sanitizeStrictly } from '@/lib/sanitizeInput';

// Rate limiting for voice processing
const VOICE_RATE_LIMIT = {
  maxRequests: 10,
  timeWindow: 60000, // 1 minute
};

const voiceRequestTracker = new Map<string, { count: number; lastReset: number }>();

/**
 * Secure voice input processing with rate limiting and validation
 */
export class VoiceInputSecurity {
  /**
   * Check if user has exceeded voice processing rate limit
   */
  static isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userTracker = voiceRequestTracker.get(userId);
    
    if (!userTracker || now - userTracker.lastReset > VOICE_RATE_LIMIT.timeWindow) {
      // Reset or initialize tracker
      voiceRequestTracker.set(userId, { count: 1, lastReset: now });
      return false;
    }
    
    if (userTracker.count >= VOICE_RATE_LIMIT.maxRequests) {
      return true;
    }
    
    userTracker.count++;
    return false;
  }

  /**
   * Validate audio blob before processing
   */
  static validateAudioBlob(audioBlob: Blob): boolean {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (audioBlob.size > maxSize) {
      console.warn('Audio file too large:', audioBlob.size);
      return false;
    }
    
    // Check MIME type
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    if (!allowedTypes.includes(audioBlob.type)) {
      console.warn('Invalid audio type:', audioBlob.type);
      return false;
    }
    
    return true;
  }

  /**
   * Sanitize transcription result
   */
  static sanitizeTranscription(transcript: string): string {
    if (!transcript || typeof transcript !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous content and sanitize
    return sanitizeStrictly(transcript.trim());
  }

  /**
   * Secure cleanup of audio data
   */
  static secureCleanup(audioBlob: Blob | null) {
    if (audioBlob) {
      // Clear the blob reference to help GC
      audioBlob = null;
    }
    
    // Clear any audio elements or contexts if they exist
    if (typeof window !== 'undefined') {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(element => {
        element.pause();
        element.src = '';
        element.load();
      });
    }
  }
}
