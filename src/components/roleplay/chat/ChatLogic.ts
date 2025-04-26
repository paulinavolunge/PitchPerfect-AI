
interface Scenario {
  difficulty: string;
  objection: string;
  industry: string;
  custom?: string;
}

export const getScenarioIntro = (scenario: Scenario, getAIPersona: () => string): string => {
  if (scenario.custom) {
    return `${getAIPersona()}: Hello! I'm ready to roleplay your custom scenario. I'll respond to your script points as a potential client. Let's begin!`;
  }
  
  const intros = {
    SaaS: "Hi there! I'm considering a new software solution for my team. I've heard about your product, but I'm not convinced it's worth the investment.",
    Retail: "Hello, I'm browsing today and noticed your product. I'm interested but have a few concerns before making a purchase.",
    'B2B Services': "Good day, I'm the procurement manager at Acme Corp. We're evaluating several service providers in your space.",
    Healthcare: "Hi, our medical practice is looking to upgrade our systems. I've been tasked with reviewing options.",
    Finance: "Hello, I'm looking to possibly switch financial services. What makes your offering different?",
    'Real Estate': "Hi there, I'm in the market for a new property, but I'm not in a rush to make a decision."
  };
  
  const objectionHints = {
    Price: "though I'm concerned about the cost",
    Urgency: "but I don't see why we need to decide quickly", 
    Trust: "though I'm not familiar with your company's track record",
    Timing: "but this isn't the right time for us",
    Competition: "and I'm also talking to your competitors",
    Need: "though I'm not convinced we need this solution"
  };
  
  let intro = intros[scenario.industry] || intros.SaaS;
  intro += ` I'm interested to learn more, ${objectionHints[scenario.objection]}.`;
  
  return `${getAIPersona()}: ${intro}`;
};

export const generateAIResponse = (userInput: string, scenario: Scenario, userScript: string | null, getAIPersona: () => string): string => {
  const lowerInput = userInput.toLowerCase();
  const persona = getAIPersona();
  
  // If we have a user script, check it for relevant content
  if (userScript) {
    console.log("Using user script for response generation:", userScript.substring(0, 100) + "...");
    
    try {
      const scriptLines = userScript.split('\n').filter(line => line.trim().length > 0);
      
      // Look for any script lines that might be related to the user's input
      const relevantLines = scriptLines.filter(line => {
        const lowerLine = line.toLowerCase();
        // Check if any significant words from user input are in this line
        const words = lowerInput.split(' ').filter(word => word.length > 4);
        return words.some(word => lowerLine.includes(word));
      });

      if (relevantLines.length > 0) {
        // Pick a random relevant line to respond to
        const randomLine = relevantLines[Math.floor(Math.random() * relevantLines.length)];
        return `${persona}: I see you're following your script. Let me challenge that point: ${
          generateObjection(randomLine)
        }`;
      } else {
        // If no direct match, respond to general script content
        const randomScriptLine = scriptLines[Math.floor(Math.random() * scriptLines.length)];
        return `${persona}: Regarding your sales approach, I have some thoughts: ${
          generateObjection(randomScriptLine || "your sales pitch")
        }`;
      }
    } catch (error) {
      console.error("Error processing script:", error);
    }
  }

  // Standard responses if no script or error processing script
  if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('expensive')) {
    if (scenario.objection === 'Price') {
      return `${persona}: I understand your concern about the price. Our solution costs more because we deliver 30% more value through our advanced features. Many customers find they recoup the investment within 6 months through increased efficiency. Would you like me to show you how the ROI calculation works for businesses like yours?`;
    }
    return `${persona}: The pricing is competitive for what we offer. We find most customers see significant value that outweighs the initial investment. What specific budget constraints are you working within?`;
  }
  
  if (lowerInput.includes('competitor') || lowerInput.includes('alternative')) {
    if (scenario.objection === 'Competition') {
      return `${persona}: I'm glad you're exploring options. We regularly win against our competitors because of our unique approach to customer success. In fact, 40% of our new customers switched from those exact alternatives. What specific competitor features are you most impressed by?`;
    }
    return `${persona}: We respect our competitors, but there are key differences in our approach. Our solution includes X and Y that others don't offer. Have you had a chance to evaluate those specific differences?`;
  }
  
  if (lowerInput.includes('time') || lowerInput.includes('urgent') || lowerInput.includes('wait')) {
    if (scenario.objection === 'Timing' || scenario.objection === 'Urgency') {
      return `${persona}: I appreciate you being upfront about timing. Many of our clients initially felt the same way, but found that delaying implementation actually cost them more in the long run. What would need to happen for this to become a priority now?`;
    }
    return `${persona}: Timing is definitely important. When would you anticipate being ready to move forward? We could use that timeframe to prepare a smooth implementation plan.`;
  }
  
  const defaultResponses = [
    `${persona}: That's an interesting perspective. Can you tell me more about how you're handling this challenge currently?`,
    `${persona}: I see where you're coming from. Many of our customers had similar concerns before they discovered how our solution addresses that exact issue.`,
    `${persona}: Let me clarify something important about that. Our approach is unique because we focus on the long-term results, not just the quick fix.`,
    `${persona}: That's a common question. The short answer is yes, but there's actually more value in how we implement it compared to others in the market.`
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

const generateObjection = (scriptLine: string): string => {
  const objections = [
    "That sounds good in theory, but how does it work in practice? Can you give me a specific example?",
    "I've heard similar promises before from your competitors. What makes your solution different?",
    "That's interesting, but I'm not sure it addresses our specific needs. Our situation is unique because...",
    "Can you provide some concrete examples of how this has worked for others in my industry?",
    "I understand what you're saying, but the timing isn't right for us. We're in the middle of another project."
  ];
  
  return objections[Math.floor(Math.random() * objections.length)];
};
