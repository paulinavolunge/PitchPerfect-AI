
import { browserInfo } from '@/utils/browserDetection';
import { VoiceService } from './VoiceService';

interface CrossBrowserVoiceConfig {
  fallbackToNative?: boolean;
  enablePolyfills?: boolean;
  gracefulDegradation?: boolean;
}

export class CrossBrowserVoiceService extends VoiceService {
  private config: CrossBrowserVoiceConfig;
  private fallbackActive = false;

  constructor(config: CrossBrowserVoiceConfig = {}) {
    super();
    this.config = {
      fallbackToNative: true,
      enablePolyfills: true,
      gracefulDegradation: true,
      ...config
    };
    
    this.initializeCrossBrowserSupport();
  }

  private initializeCrossBrowserSupport(): void {
    // Browser-specific initialization
    if (browserInfo.isSafari) {
      this.initializeSafariSupport();
    } else if (browserInfo.isFirefox) {
      this.initializeFirefoxSupport();
    } else if (browserInfo.isEdge) {
      this.initializeEdgeSupport();
    }
  }

  private initializeSafariSupport(): void {
    // Safari has limited Web Speech API support
    // Use native speech synthesis when available
    if (!browserInfo.supportsWebSpeech && this.config.fallbackToNative) {
      this.fallbackActive = true;
      console.warn('Safari: Limited Web Speech API support, using fallback methods');
    }
  }

  private initializeFirefoxSupport(): void {
    // Firefox has good Web Speech API support but different permission handling
    if (browserInfo.supportsWebSpeech) {
      console.log('Firefox: Web Speech API supported');
    } else {
      this.fallbackActive = true;
      console.warn('Firefox: Web Speech API not available, using fallback');
    }
  }

  private initializeEdgeSupport(): void {
    // Edge has good support for Web Speech API
    if (browserInfo.supportsWebSpeech) {
      console.log('Edge: Web Speech API supported');
    } else {
      this.fallbackActive = true;
      console.warn('Edge: Web Speech API not available, using fallback');
    }
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      // Browser-specific permission checking
      if (browserInfo.isFirefox) {
        return await this.checkFirefoxMicrophonePermission();
      } else if (browserInfo.isSafari) {
        return await this.checkSafariMicrophonePermission();
      } else {
        return await super.checkMicrophonePermission();
      }
    } catch (error) {
      console.error('Cross-browser microphone permission check failed:', error);
      return false;
    }
  }

  private async checkFirefoxMicrophonePermission(): Promise<boolean> {
    try {
      // Firefox permission API may not be fully supported
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return result.state === 'granted';
      } else {
        // Fallback: try to access microphone directly
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  private async checkSafariMicrophonePermission(): Promise<boolean> {
    try {
      // Safari requires user interaction for microphone access
      if (browserInfo.isMobile) {
        // On mobile Safari, permission check is more restrictive
        return false; // Always prompt for permission on mobile Safari
      } else {
        // Desktop Safari
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  async initializeAudioAnalysis(): Promise<void> {
    try {
      if (browserInfo.isSafari && browserInfo.isMobile) {
        // iOS Safari has stricter audio context restrictions
        await this.initializeIOSSafariAudio();
      } else {
        await super.initializeAudioAnalysis();
      }
    } catch (error) {
      console.error('Cross-browser audio analysis initialization failed:', error);
      throw error;
    }
  }

  private async initializeIOSSafariAudio(): Promise<void> {
    // iOS Safari requires user gesture for AudioContext
    return new Promise((resolve, reject) => {
      const handleUserGesture = async () => {
        try {
          await super.initializeAudioAnalysis();
          document.removeEventListener('touchstart', handleUserGesture);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      document.addEventListener('touchstart', handleUserGesture, { once: true });
      
      // Also try immediately in case we already have permission
      super.initializeAudioAnalysis().then(resolve).catch(() => {
        // Ignore error, wait for user gesture
      });
    });
  }

  async speak(options: any): Promise<void> {
    try {
      if (this.fallbackActive || !browserInfo.supportsWebSpeech) {
        return await this.fallbackSpeak(options);
      } else {
        return await super.speak(options.text, options, options);
      }
    } catch (error) {
      if (this.config.gracefulDegradation) {
        console.warn('Speech synthesis failed, using fallback:', error);
        return await this.fallbackSpeak(options);
      } else {
        throw error;
      }
    }
  }

  private async fallbackSpeak(options: any): Promise<void> {
    // Simple text-to-speech fallback for unsupported browsers
    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(options.text);
        utterance.onend = () => resolve();
        speechSynthesis.speak(utterance);
      });
    } else {
      // No speech synthesis available, show text instead
      console.log('Speech synthesis not available. Text:', options.text);
      return Promise.resolve();
    }
  }

  getBrowserCapabilities() {
    return {
      browserInfo,
      supportsWebSpeech: browserInfo.supportsWebSpeech,
      supportsWebAudio: browserInfo.supportsWebAudio,
      supportsMediaDevices: browserInfo.supportsMediaDevices,
      fallbackActive: this.fallbackActive,
      recommendedFallbacks: this.getRecommendedFallbacks()
    };
  }

  private getRecommendedFallbacks(): string[] {
    const fallbacks: string[] = [];
    
    if (!browserInfo.supportsWebSpeech) {
      fallbacks.push('Web Speech API not supported - using browser SpeechSynthesis API');
    }
    
    if (!browserInfo.supportsWebAudio) {
      fallbacks.push('Web Audio API not supported - audio analysis limited');
    }
    
    if (!browserInfo.supportsMediaDevices) {
      fallbacks.push('MediaDevices API not supported - microphone access limited');
    }
    
    if (browserInfo.isSafari && browserInfo.isMobile) {
      fallbacks.push('iOS Safari detected - user interaction required for audio features');
    }
    
    return fallbacks;
  }
}

export const crossBrowserVoiceService = new CrossBrowserVoiceService();
