
// Demo utils for handling demo-specific functionality

/**
 * Get a sample scenario for the demo
 * In a real implementation, this would fetch from an API or JSON file
 */
export const getSampleScenario = async () => {
  // Returns a demo scenario for practice
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
  // Simulates analyzing audio input and providing feedback
  // In a real implementation, this would POST to /api/waitlist
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      console.log(`Added ${email} to waitlist`);
      resolve({ success: true });
    }, 1000);
  });
};

// Type definitions are centralized in src/types/browser-apis.d.ts
