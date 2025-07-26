
// Basic polyfills for browser compatibility
import { secureLog } from './secureLog';
export const initializePolyfills = () => {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  try {
    // Basic getUserMedia polyfill
    if (navigator && !navigator.mediaDevices && (navigator as any).getUserMedia) {
      (navigator as any).mediaDevices = {};
      (navigator as any).mediaDevices.getUserMedia = function(constraints: MediaStreamConstraints) {
        return new Promise((resolve, reject) => {
          (navigator as any).getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    // Basic AudioContext polyfill
    if (window && !window.AudioContext && (window as any).webkitAudioContext) {
      (window as any).AudioContext = (window as any).webkitAudioContext;
    }

    // Basic SpeechRecognition polyfill
    if (window && !(window as any).SpeechRecognition && (window as any).webkitSpeechRecognition) {
      (window as any).SpeechRecognition = (window as any).webkitSpeechRecognition;
    }

  } catch (error) {
    secureLog.warn('Polyfill initialization failed:', error);
  }
};
