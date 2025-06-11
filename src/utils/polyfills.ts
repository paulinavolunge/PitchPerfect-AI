
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
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}

export const initializePolyfills = () => {
  // Early return if not in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    console.log('🔧 Polyfills skipped - not in browser environment');
    return;
  }

  try {
    console.log('🔧 Starting polyfill initialization...');

    // Safe browser detection
    let userAgent = '';
    try {
      userAgent = navigator.userAgent || '';
    } catch (e) {
      console.warn('Could not access navigator.userAgent');
    }

    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isIOS = /iP(ad|hone|od)/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);

    console.log('🔧 Browser detection:', { isSafari, isIOS, isFirefox });

    // Polyfill for getUserMedia
    try {
      if (navigator && !navigator.mediaDevices) {
        const legacyGetUserMedia = (navigator as any).getUserMedia || 
                                  (navigator as any).webkitGetUserMedia || 
                                  (navigator as any).mozGetUserMedia;
        
        if (legacyGetUserMedia) {
          (navigator as any).mediaDevices = {};
          (navigator as any).mediaDevices.getUserMedia = function(constraints: MediaStreamConstraints) {
            return new Promise((resolve, reject) => {
              legacyGetUserMedia.call(navigator, constraints, resolve, reject);
            });
          };
          console.log('🔧 getUserMedia polyfill applied');
        }
      }
    } catch (e) {
      console.warn('getUserMedia polyfill failed:', e);
    }

    // Polyfill for AudioContext
    try {
      if (window && !window.AudioContext && (window as any).webkitAudioContext) {
        (window as any).AudioContext = (window as any).webkitAudioContext;
        console.log('🔧 AudioContext polyfill applied');
      }
    } catch (e) {
      console.warn('AudioContext polyfill failed:', e);
    }

    // Polyfill for SpeechRecognition
    try {
      if (window && !(window as any).SpeechRecognition && (window as any).webkitSpeechRecognition) {
        (window as any).SpeechRecognition = (window as any).webkitSpeechRecognition;
        console.log('🔧 SpeechRecognition polyfill applied');
      }
    } catch (e) {
      console.warn('SpeechRecognition polyfill failed:', e);
    }

    // Polyfill for requestAnimationFrame
    try {
      if (window && !window.requestAnimationFrame) {
        (window as any).requestAnimationFrame = function(callback: FrameRequestCallback) {
          return window.setTimeout(callback, 1000 / 60);
        };
        console.log('🔧 requestAnimationFrame polyfill applied');
      }

      if (window && !window.cancelAnimationFrame) {
        (window as any).cancelAnimationFrame = function(id: number) {
          window.clearTimeout(id);
        };
        console.log('🔧 cancelAnimationFrame polyfill applied');
      }
    } catch (e) {
      console.warn('Animation frame polyfills failed:', e);
    }

    // Safari-specific fixes
    if (isSafari) {
      try {
        let audioContextUnlocked = false;
        
        const unlockAudioContext = () => {
          if (audioContextUnlocked) return;
          
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          
          try {
            const context = new AudioContextClass();
            const buffer = context.createBuffer(1, 1, 22050);
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);
            
            audioContextUnlocked = true;
            document.removeEventListener('touchstart', unlockAudioContext);
            document.removeEventListener('click', unlockAudioContext);
            console.log('🔧 Safari AudioContext unlocked');
          } catch (error) {
            console.warn('Could not unlock AudioContext on Safari:', error);
          }
        };
        
        document.addEventListener('touchstart', unlockAudioContext, { once: true });
        document.addEventListener('click', unlockAudioContext, { once: true });
      } catch (e) {
        console.warn('Safari-specific fixes failed:', e);
      }
    }

    // iOS-specific fixes
    if (isIOS) {
      try {
        let microphoneUnlocked = false;
        
        const unlockMicrophone = async () => {
          if (microphoneUnlocked) return;
          
          try {
            const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
            if (stream) {
              stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
              microphoneUnlocked = true;
              console.log('🔧 iOS microphone unlocked');
            }
          } catch (error) {
            console.warn('Could not unlock microphone on iOS:', error);
          }
        };
        
        document.addEventListener('touchstart', unlockMicrophone, { once: true });
      } catch (e) {
        console.warn('iOS-specific fixes failed:', e);
      }
    }

    // Firefox-specific fixes
    if (isFirefox) {
      try {
        if (navigator && !(navigator as any).permissions) {
          (navigator as any).permissions = {
            query: () => Promise.resolve({ state: 'prompt' })
          };
          console.log('🔧 Firefox permissions polyfill applied');
        }
      } catch (e) {
        console.warn('Firefox-specific fixes failed:', e);
      }
    }

    console.log('🔧 Polyfills initialized successfully');
    
    // Debug logging for voice features
    try {
      console.log('🎤 Voice API Support:');
      console.log('  - getUserMedia:', !!(navigator?.mediaDevices?.getUserMedia));
      console.log('  - SpeechRecognition:', !!(window && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)));
      console.log('  - SpeechSynthesis:', !!(window?.speechSynthesis));
      console.log('  - AudioContext:', !!(window && (window.AudioContext || (window as any).webkitAudioContext)));
    } catch (e) {
      console.warn('Voice API debug logging failed:', e);
    }
    
  } catch (error) {
    console.error('Error during polyfill initialization:', error);
    // Don't re-throw - just log and continue
  }
};
