
/**
 * Voice synthesis utility for handling text-to-speech with cross-browser support
 */
export interface SpeechOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

class VoiceSynthesis {
  private static instance: VoiceSynthesis;
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean;
  
  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    
    if (this.isSupported) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
      }
    }
  }
  
  public static getInstance(): VoiceSynthesis {
    if (!VoiceSynthesis.instance) {
      VoiceSynthesis.instance = new VoiceSynthesis();
    }
    return VoiceSynthesis.instance;
  }
  
  private loadVoices(): void {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
  }
  
  /**
   * Check if speech synthesis is supported in this browser
   */
  public isVoiceSupported(): boolean {
    return this.isSupported;
  }
  
  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  /**
   * Find suitable voice based on preference
   * @param voicePreference Name or style of voice to use
   */
  private findVoice(voicePreference?: string): SpeechSynthesisVoice | null {
    if (!this.voices.length || !voicePreference) return null;

    // Try exact match on name
    let voice = this.voices.find(v => 
      v.name.toLowerCase() === voicePreference.toLowerCase()
    );
    
    // Try partial match on name
    if (!voice) {
      voice = this.voices.find(v => 
        v.name.toLowerCase().includes(voicePreference.toLowerCase())
      );
    }
    
    // Try match on language containing 'en'
    if (!voice) {
      voice = this.voices.find(v => v.lang.includes('en'));
    }
    
    return voice || null;
  }
  
  /**
   * Speak text with specified options
   */
  public async speak(options: SpeechOptions): Promise<void> {
    if (!this.isSupported || !this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }
    
    // Stop any ongoing speech
    this.stop();
    
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(options.text);
        
        // Apply options
        utterance.rate = options.rate ?? 1;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;
        
        // Set voice if provided
        if (options.voice) {
          const voice = this.findVoice(options.voice);
          if (voice) {
            utterance.voice = voice;
          }
        }
        
        // Handle events
        utterance.onend = () => {
          this.currentUtterance = null;
          resolve();
        };
        
        utterance.onerror = (event) => {
          this.currentUtterance = null;
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };
        
        // Save reference and start speaking
        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
        
        // Fix for some browsers where speech doesn't start
        if (this.synthesis.paused) {
          this.synthesis.resume();
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Stop any ongoing speech
   */
  public stop(): void {
    if (!this.synthesis) return;
    
    this.synthesis.cancel();
    this.currentUtterance = null;
  }
  
  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }
  
  /**
   * Get supported voice styles for the app
   */
  public getVoiceStyles(): string[] {
    return ['friendly', 'assertive', 'skeptical', 'rushed'];
  }
}

export default VoiceSynthesis;
