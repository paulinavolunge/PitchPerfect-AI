
export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsWebSpeech: boolean;
  supportsWebAudio: boolean;
  supportsMediaDevices: boolean;
}

export const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  
  // Browser detection
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isEdge = /Edge/.test(userAgent) || /Edg/.test(userAgent);
  
  // Mobile detection
  const isMobile = /Mobile|Android|iP(ad|hone)/.test(userAgent);
  const isIOS = /iP(ad|hone|od)/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  // Feature detection
  const supportsWebSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const supportsWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
  const supportsMediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  
  // Get browser name and version
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (isChrome) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (isFirefox) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (isSafari) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (isEdge) {
    name = 'Edge';
    const match = userAgent.match(/Edg?\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  return {
    name,
    version,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isMobile,
    isIOS,
    isAndroid,
    supportsWebSpeech,
    supportsWebAudio,
    supportsMediaDevices
  };
};

export const browserInfo = detectBrowser();
