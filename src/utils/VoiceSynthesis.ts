
interface SpeechOptions {
  text: string;
  volume?: number; // 0 to 1
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  voice?: string; // Voice name or identifier
}

export class VoiceSynthesis {
  private static instance: VoiceSynthesis;
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private voiceMap: Record<string, SpeechSynthesisVoice> = {};
  private isSpeaking = false;
  
  private constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Handle voice loaded event
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }

  public static getInstance(): VoiceSynthesis {
    if (!VoiceSynthesis.instance) {
      VoiceSynthesis.instance = new VoiceSynthesis();
    }
    return VoiceSynthesis.instance;
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    
    // Create a map for quick access by name
    this.voices.forEach(voice => {
      this.voiceMap[voice.name.toLowerCase()] = voice;
    });
    
    console.log('Available voices:', this.voices.map(v => v.name));
  }

  public async speak(options: SpeechOptions): Promise<void> {
    const { text, volume = 1, rate = 1, pitch = 1, voice } = options;
    
    // Cancel any ongoing speech
    this.stop();
    
    return new Promise((resolve) => {
      // Split text into sentences for more natural speech
      const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
      
      // Speak each sentence
      let sentenceIndex = 0;
      
      const speakNextSentence = () => {
        if (sentenceIndex < sentences.length) {
          const utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex] + '.');
          
          utterance.volume = volume;
          utterance.rate = rate;
          utterance.pitch = pitch;
          
          // Set voice if provided and available
          if (voice) {
            const selectedVoice = this.findVoice(voice);
            if (selectedVoice) {
              utterance.voice = selectedVoice;
            }
          }
          
          this.isSpeaking = true;
          
          utterance.onend = () => {
            sentenceIndex++;
            speakNextSentence();
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            sentenceIndex++;
            speakNextSentence();
          };
          
          this.synth.speak(utterance);
        } else {
          this.isSpeaking = false;
          resolve();
        }
      };
      
      speakNextSentence();
    });
  }

  public stop(): void {
    if (this.synth && this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
  
  public isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }
  
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  public findVoice(nameOrIdentifier: string): SpeechSynthesisVoice | null {
    const lowerCaseName = nameOrIdentifier.toLowerCase();
    return this.voiceMap[lowerCaseName] || null;
  }
  
  public getVoiceForPersona(persona: string): SpeechSynthesisVoice | null {
    // Map personas to preferred voices
    const personaVoiceMap: Record<string, string[]> = {
      friendly: ['Samantha', 'Karen', 'Google US English Female'],
      assertive: ['Alex', 'Daniel', 'Google US English Male'],
      skeptical: ['Victoria', 'Fiona', 'Google UK English Female'],
      rushed: ['Fred', 'Google US English Male', 'Alex']
    };
    
    const personaKey = persona.toLowerCase() as keyof typeof personaVoiceMap;
    const preferredVoices = personaVoiceMap[personaKey] || ['Google US English', 'Samantha', 'Alex'];
    
    // Try to find a preferred voice
    for (const voiceName of preferredVoices) {
      const voice = this.findVoice(voiceName);
      if (voice) return voice;
    }
    
    // Fallback to any English voice
    return this.voices.find(v => v.lang.includes('en')) || this.voices[0] || null;
  }
}

export default VoiceSynthesis;
