
interface VoiceDebugResult {
  feature: string;
  supported: boolean;
  error?: string;
  details?: any;
}

export class VoiceDebugger {
  private static results: VoiceDebugResult[] = [];

  static async runFullDiagnostics(): Promise<VoiceDebugResult[]> {
    console.log('🔍 Starting Voice Feature Diagnostics...');
    this.results = [];

    // Test 1: Basic API Support
    await this.testBasicAPISupport();
    
    // Test 2: Microphone Access
    await this.testMicrophoneAccess();
    
    // Test 3: Speech Recognition
    await this.testSpeechRecognition();
    
    // Test 4: Speech Synthesis
    await this.testSpeechSynthesis();
    
    // Test 5: Web Audio API
    await this.testWebAudioAPI();

    console.log('🔍 Voice Diagnostics Complete:', this.results);
    return this.results;
  }

  private static addResult(feature: string, supported: boolean, error?: string, details?: any) {
    const result = { feature, supported, error, details };
    this.results.push(result);
    console.log(`🔍 ${feature}: ${supported ? '✅ PASS' : '❌ FAIL'}`, error || details || '');
  }

  private static async testBasicAPISupport() {
    try {
      const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
      const hasSpeechRecognition = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
      const hasSpeechSynthesis = !!window.speechSynthesis;
      const hasAudioContext = !!window.AudioContext || !!(window as any).webkitAudioContext;

      this.addResult('getUserMedia API', hasGetUserMedia);
      this.addResult('SpeechRecognition API', hasSpeechRecognition);
      this.addResult('SpeechSynthesis API', hasSpeechSynthesis);
      this.addResult('AudioContext API', hasAudioContext);
    } catch (error) {
      this.addResult('Basic API Support', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testMicrophoneAccess() {
    try {
      console.log('🎤 Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (stream) {
        const tracks = stream.getTracks();
        this.addResult('Microphone Access', true, undefined, {
          trackCount: tracks.length,
          trackLabels: tracks.map(t => t.label || 'unnamed'),
          trackStates: tracks.map(t => t.readyState)
        });
        
        // Clean up
        tracks.forEach(track => track.stop());
      } else {
        this.addResult('Microphone Access', false, 'No stream returned');
      }
    } catch (error) {
      this.addResult('Microphone Access', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testSpeechRecognition() {
    try {
      console.log('🗣️ Testing speech recognition...');
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        this.addResult('Speech Recognition', false, 'SpeechRecognition constructor not available');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Test initialization
      this.addResult('Speech Recognition Init', true, undefined, {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang
      });

      // Test short recognition session
      return new Promise<void>((resolve) => {
        recognition.onstart = () => {
          console.log('🗣️ Speech recognition started');
          setTimeout(() => {
            recognition.stop();
          }, 1000); // Stop after 1 second
        };

        recognition.onresult = (event: any) => {
          console.log('🗣️ Speech recognition result:', event);
          this.addResult('Speech Recognition Test', true, undefined, {
            resultCount: event.results.length
          });
          resolve();
        };

        recognition.onerror = (event: any) => {
          console.log('🗣️ Speech recognition error:', event);
          this.addResult('Speech Recognition Test', false, event.error);
          resolve();
        };

        recognition.onend = () => {
          console.log('🗣️ Speech recognition ended');
          resolve();
        };

        try {
          recognition.start();
        } catch (error) {
          this.addResult('Speech Recognition Test', false, error instanceof Error ? error.message : 'Failed to start');
          resolve();
        }
      });
    } catch (error) {
      this.addResult('Speech Recognition', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testSpeechSynthesis() {
    try {
      console.log('🔊 Testing speech synthesis...');
      
      if (!window.speechSynthesis) {
        this.addResult('Speech Synthesis', false, 'speechSynthesis not available');
        return;
      }

      const voices = speechSynthesis.getVoices();
      this.addResult('Speech Synthesis Voices', voices.length > 0, undefined, {
        voiceCount: voices.length,
        voices: voices.slice(0, 3).map(v => ({ name: v.name, lang: v.lang }))
      });

      // Test utterance creation
      const utterance = new SpeechSynthesisUtterance('Test');
      utterance.volume = 0; // Silent test
      
      return new Promise<void>((resolve) => {
        utterance.onstart = () => {
          this.addResult('Speech Synthesis Test', true);
          resolve();
        };

        utterance.onerror = (event) => {
          this.addResult('Speech Synthesis Test', false, event.error);
          resolve();
        };

        utterance.onend = () => {
          resolve();
        };

        speechSynthesis.speak(utterance);
        
        // Timeout fallback
        setTimeout(() => {
          speechSynthesis.cancel();
          resolve();
        }, 2000);
      });
    } catch (error) {
      this.addResult('Speech Synthesis', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private static async testWebAudioAPI() {
    try {
      console.log('🎵 Testing Web Audio API...');
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContext) {
        this.addResult('Web Audio API', false, 'AudioContext not available');
        return;
      }

      const context = new AudioContext();
      
      this.addResult('Web Audio API', true, undefined, {
        state: context.state,
        sampleRate: context.sampleRate,
        destination: !!context.destination
      });

      // Test with microphone if available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        
        source.connect(analyser);
        
        this.addResult('Web Audio + Microphone', true, undefined, {
          analyserFFTSize: analyser.fftSize,
          frequencyBinCount: analyser.frequencyBinCount
        });

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        await context.close();
      } catch (micError) {
        this.addResult('Web Audio + Microphone', false, micError instanceof Error ? micError.message : 'Microphone test failed');
        await context.close();
      }
    } catch (error) {
      this.addResult('Web Audio API', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  static getLastResults(): VoiceDebugResult[] {
    return this.results;
  }

  static printSummary(): void {
    console.log('\n🔍 === Voice Feature Debug Summary ===');
    this.results.forEach(result => {
      console.log(`${result.supported ? '✅' : '❌'} ${result.feature}`);
      if (result.error) console.log(`   Error: ${result.error}`);
      if (result.details) console.log(`   Details:`, result.details);
    });
    console.log('=====================================\n');
  }
}
