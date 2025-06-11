
import { browserInfo } from './browserDetection';

// Polyfill for getUserMedia
if (!navigator.mediaDevices && navigator.getUserMedia) {
  navigator.mediaDevices = {};
  navigator.mediaDevices.getUserMedia = function(constraints) {
    const getUserMedia = navigator.getUserMedia || 
                        (navigator as any).webkitGetUserMedia || 
                        (navigator as any).mozGetUserMedia;
    
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }
    
    return new Promise((resolve, reject) => {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

// Polyfill for AudioContext
if (!window.AudioContext && (window as any).webkitAudioContext) {
  window.AudioContext = (window as any).webkitAudioContext;
}

// Polyfill for SpeechRecognition
if (!window.SpeechRecognition && (window as any).webkitSpeechRecognition) {
  window.SpeechRecognition = (window as any).webkitSpeechRecognition;
}

// Polyfill for requestAnimationFrame
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback) {
    return window.setTimeout(callback, 1000 / 60);
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    window.clearTimeout(id);
  };
}

// Safari-specific fixes
if (browserInfo.isSafari) {
  // Safari requires user interaction before playing audio
  let audioContextUnlocked = false;
  
  const unlockAudioContext = () => {
    if (audioContextUnlocked) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const context = new AudioContextClass();
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    
    audioContextUnlocked = true;
    document.removeEventListener('touchstart', unlockAudioContext);
    document.removeEventListener('click', unlockAudioContext);
  };
  
  document.addEventListener('touchstart', unlockAudioContext, { once: true });
  document.addEventListener('click', unlockAudioContext, { once: true });
}

// iOS-specific fixes
if (browserInfo.isIOS) {
  // iOS requires user gesture for microphone access
  let microphoneUnlocked = false;
  
  const unlockMicrophone = async () => {
    if (microphoneUnlocked) return;
    
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        microphoneUnlocked = true;
      }
    } catch (error) {
      console.warn('Could not unlock microphone on iOS:', error);
    }
  };
  
  document.addEventListener('touchstart', unlockMicrophone, { once: true });
}

// Firefox-specific fixes
if (browserInfo.isFirefox) {
  // Firefox has different permission handling
  if (!navigator.permissions) {
    (navigator as any).permissions = {
      query: () => Promise.resolve({ state: 'prompt' })
    };
  }
}

export const initializePolyfills = () => {
  console.log(`Browser: ${browserInfo.name} ${browserInfo.version}`);
  console.log('Polyfills initialized for cross-browser compatibility');
};
