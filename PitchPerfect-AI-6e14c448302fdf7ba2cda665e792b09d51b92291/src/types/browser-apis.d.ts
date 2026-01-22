// Global browser API type extensions
export {};

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
    chrome?: {
      runtime?: unknown;
    };
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: unknown;
    ENV?: Record<string, string>;
    loadAnalytics?: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message?: string;
  }

  // Extended interface to match browser implementations
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives?: number;
    grammars?: SpeechGrammarList;
    serviceURI?: string;
    
    start(): void;
    stop(): void;
    abort(): void;
    
    onstart?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult?: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror?: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onspeechstart?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend?: ((this: SpeechRecognition, ev: Event) => any) | null;
    onnomatch?: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechGrammarList {
    readonly length: number;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
    addFromURI?(src: string, weight?: number): void;
    addFromString?(string: string, weight?: number): void;
  }

  interface SpeechGrammar {
    src?: string;
    weight?: number;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}