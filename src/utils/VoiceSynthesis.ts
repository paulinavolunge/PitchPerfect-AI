import VoiceMetrics from './VoiceMetrics';

/**
 * Singleton class for handling voice synthesis
 */
class VoiceSynthesis {
  private static instance: VoiceSynthesis;
  private synth: SpeechSynthesis;
  private voiceMetrics: VoiceMetrics;
  private speaking: boolean = false;

  private constructor() {
    this.synth = window.speechSynthesis;
    this.voiceMetrics = VoiceMetrics.getInstance();
  }

  public static getInstance(): VoiceSynthesis {
    if (!VoiceSynthesis.instance) {
      VoiceSynthesis.instance = new VoiceSynthesis();
    }
    return VoiceSynthesis.instance;
  }

  /**
   * Get available voices
   * @returns Array of SpeechSynthesisVoice objects
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Speak text
   * @param text Text to speak
   * @param volume Volume between 0 and 1
   * @param rate Rate of speech
   * @param pitch Pitch of speech
   * @param voice Voice to use
   */
  public speak({
    text,
    volume = 0.7,
    rate = 1,
    pitch = 1,
    voice = 'Alex'
  }: {
    text: string;
    volume?: number;
    rate?: number;
    pitch?: number;
    voice?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.speaking) {
        this.stop();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Find the right voice
      const voices = this.getVoices();
      const selectedVoice = voices.find(v => v.name.includes(voice));
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn(`Voice "${voice}" not found. Using default voice.`);
      }

      utterance.onstart = () => {
        this.speaking = true;
        this.voiceMetrics.startTiming(utterance.text);
      };

      utterance.onend = () => {
        this.speaking = false;
        this.voiceMetrics.endTiming(utterance.text);
        resolve();
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        this.speaking = false;
        console.error('Speech synthesis error:', event.error);
        reject(event.error);
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  public stop(): void {
    this.synth.cancel();
    this.speaking = false;
  }

  /**
   * Check if speaking
   * @returns True if speaking, false otherwise
   */
  public isSpeaking(): boolean {
    return this.speaking;
  }
}

export default VoiceSynthesis;
