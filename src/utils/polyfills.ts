
import { browserInfo } from './browserDetection';

// Extend Navigator interface for polyfills
declare global {
  interface Navigator {
    getUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: any) => void
    ) => void;
    webkitGetUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: any) => void
    ) => void;
    mozGetUserMedia?: (
      constraints: MediaStreamConstraints,
      successCallback: (stream: MediaStream) => void,
      errorCallback: (error: any) => void
    ) => void;
  }

  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}

// Polyfill for getUserMedia
if (!navigator.mediaDevices && (navigator.getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia)) {
  (navigator as any).mediaDevices = {};
  (navigator as any).mediaDevices.getUserMedia = function(constraints: MediaStreamConstraints) {
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
  (window as any).AudioContext = (window as any).webkitAudioContext;
}

// Polyfill for SpeechRecognition
if (!window.SpeechRecognition && (window as any).webkitSpeechRecognition) {
  (window as any).SpeechRecognition = (window as any).webkitSpeechRecognition;
}

// Polyfill for requestAnimationFrame
if (!window.requestAnimationFrame) {
  (window as any).requestAnimationFrame = function(callback: FrameRequestCallback) {
    return window.setTimeout(callback, 1000 / 60);
  };
}

if (!window.cancelAnimationFrame) {
  (window as any).cancelAnimationFrame = function(id: number) {
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
      const stream = await (navigator as any).mediaDevices?.getUserMedia({ audio: true });
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
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
  if (!(navigator as any).permissions) {
    (navigator as any).permissions = {
      query: () => Promise.resolve({ state: 'prompt' })
    };
  }
}

export const initializePolyfills = () => {
  console.log(`Browser: ${browserInfo.name} ${browserInfo.version}`);
  console.log('Polyfills initialized for cross-browser compatibility');
};
