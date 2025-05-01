
// Demo utils for handling demo-specific functionality

/**
 * Get a sample scenario for the demo
 * In a real implementation, this would fetch from an API or JSON file
 */
export const getSampleScenario = async () => {
  // This is a mock function that returns a hardcoded scenario
  // In a real implementation, this would fetch from /data/scenarios.json
  return {
    id: "price-objection",
    title: "Handling Price Objections",
    difficulty: "Medium",
    industry: "Software as a Service",
    objection: "Price",
    prompt: "Your solution looks interesting, but honestly, it's priced higher than what we were expecting to pay. We have other options that cost less.",
    tips: [
      "Focus on value, not just cost",
      "Compare ROI with competing solutions",
      "Highlight unique features that justify the price",
      "Ask about specific budget concerns"
    ]
  };
};

/**
 * Add a user to the waitlist
 */
export const addToWaitlist = async (email: string) => {
  // This is a mock function that simulates an API call
  // In a real implementation, this would POST to /api/waitlist
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      console.log(`Added ${email} to waitlist`);
      resolve({ success: true });
    }, 1000);
  });
};

// Add type definitions for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
}

export {};
