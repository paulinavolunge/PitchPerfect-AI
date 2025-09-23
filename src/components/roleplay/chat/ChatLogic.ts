import { salesMethodologies } from '../../data/salesMethodologies';
import { objectionDetectionService, ObjectionType } from '../../../services/ObjectionDetectionService';
import { ContentSafetyAnalyzer } from '@/utils/contentSafety';
import { supabase } from '@/integrations/supabase/client';

interface Scenario {
  difficulty: string;
  objection: string;
  industry: string;
  custom?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const getScenarioIntro = (scenario: Scenario, getAIPersona: () => string): string => {
  return `${getAIPersona()}: Hello! I'm ready to roleplay as a potential client. I'll present objections and you can practice overcoming them. Let's begin!`;
};

export const generateFirstObjection = async (scenario: Scenario, getAIPersona: () => string): Promise<string> => {
  const persona = getAIPersona();
  
  if (scenario.custom) {
    return `${persona}: ${scenario.custom}`;
  }
  
  const objectionStatements = {
    Price: [
      "Your solution costs more than I budgeted for. I can get similar features elsewhere for 30% less. Why should I pay extra?",
      "The pricing seems steep for a company our size. We're a small business and every dollar counts. Can you justify this investment?"
    ],
    Timing: [
      "This isn't a good time for us. We just implemented a new system last year and aren't ready for another change.",
      "I don't see the urgency. Our current process works fine, even if it's not perfect. Why do I need to act now?"
    ],
    Trust: [
      "I've never heard of your company before today. How do I know you'll still be in business next year to support this?",
      "Your company is too small for us to take a risk on. We need a proven vendor with a long track record."
    ],
    Authority: [
      "I'm interested, but I don't make these decisions alone. My boss will never approve this without more justification.",
      "This looks good, but I'll need to run it by our procurement team and they're very particular about vendors."
    ],
    Competition: [
      "I'm already talking to [Competitor] and they're offering me a better deal. What makes you different?",
      "Your competitor just quoted me 25% less for the same features. Can you match their price?"
    ],
    Need: [
      "I'm not convinced we actually need this. We've been doing fine without it for years. Why change now?",
      "This seems like a nice-to-have, not a must-have. We have bigger priorities right now."
    ]
  };
  
  const objections = objectionStatements[scenario.objection as keyof typeof objectionStatements] || objectionStatements.Need;
  const selectedObjection = objections[Math.floor(Math.random() * objections.length)];
  
  return `${persona}: ${selectedObjection}`;
};

export const generateAIResponse = async (
  userInput: string, 
  scenario: Scenario, 
  userScript: string | null, 
  getAIPersona: () => string,
  conversationHistory: Message[] = []
): Promise<string> => {
  const persona = getAIPersona();
  
  console.log("🤖 Generating AI response for input:", userInput);
  console.log("📝 Scenario:", scenario);
  console.log("🎭 Persona:", persona);
  
  // Content safety check for user input
  const safetyAnalysis = ContentSafetyAnalyzer.analyzeContent(userInput, 'USER_MESSAGE');
  if (safetyAnalysis.blocked) {
    console.warn('User input blocked by content safety:', safetyAnalysis.issues);
    return `${persona}: I'm sorry, but I can't respond to that type of content. Let's keep our conversation professional and focused on sales practice.`;
  }

  // Use sanitized input if available
  const safeUserInput = safetyAnalysis.sanitizedContent || userInput;
  
  try {
    console.log("🚀 Calling roleplay-ai-response edge function...");
    
    // Call the secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('roleplay-ai-response', {
      body: {
        userInput: safeUserInput,
        scenario: scenario,
        voiceStyle: getVoiceStyleFromPersona(persona),
        userScript: userScript,
        conversationHistory: conversationHistory.slice(-6), // Last 6 messages for context
        isReversedRole: true // New flag to indicate reversed roles
      }
    });

    console.log("📡 Edge function response:", { data, error });

    if (error) {
      console.error('❌ Error calling roleplay AI function:', error);
      throw new Error(error.message);
    }

    if (!data || !data.response) {
      console.error('❌ No response received from AI service');
      throw new Error('No response received from AI service');
    }

    console.log("✅ AI response received:", data.response);
    const aiResponse = `${persona}: ${data.response}`;
    
    // Safety check for AI output
    const outputSafety = ContentSafetyAnalyzer.analyzeAIOutput(aiResponse);
    if (outputSafety.blocked) {
      return `${persona}: I apologize, but I need to adjust my response. Let me try a different approach to address your concern.`;
    }
    
    return outputSafety.sanitizedContent || aiResponse;

  } catch (error) {
    console.error('💥 Failed to generate AI response:', error);
    
    // Enhanced fallback response with more context
    return generateFallbackResponse(userInput, scenario, persona, conversationHistory);
  }
};

// Helper function to map persona names to voice styles
function getVoiceStyleFromPersona(persona: string): string {
  const personaMap: { [key: string]: string } = {
    'Alex': 'friendly',
    'Jordan': 'assertive', 
    'Morgan': 'skeptical',
    'Taylor': 'rushed',
  };
  
  for (const [name, style] of Object.entries(personaMap)) {
    if (persona.includes(name)) {
      return style;
    }
  }
  
  return 'friendly'; // default
}

// Enhanced fallback response generation for reversed roles
function generateFallbackResponse(userInput: string, scenario: Scenario, persona: string, conversationHistory: Message[] = []): string {
  console.log("🔄 Using fallback response generation for reversed roles");
  
  const lowerInput = userInput.toLowerCase();
  const isFirstExchange = conversationHistory.length <= 1;
  
  // If this is early in conversation, provide feedback on their objection handling
  if (!isFirstExchange) {
    // Analyze their objection handling response based on actual input
    return analyzeUserResponse(userInput, scenario, persona, conversationHistory);
  }
  
  // If this is the first exchange, present the initial objection
  const initialObjections = {
    Price: [
      `${persona}: Your solution costs more than I budgeted for. I can get similar features elsewhere for 30% less. Why should I pay extra?`,
      `${persona}: The pricing seems steep for a company our size. We're a small business and every dollar counts. Can you justify this investment?`
    ],
    Timing: [
      `${persona}: This isn't a good time for us. We just implemented a new system last year and aren't ready for another change.`,
      `${persona}: I don't see the urgency. Our current process works fine, even if it's not perfect. Why do I need to act now?`
    ],
    Trust: [
      `${persona}: I've never heard of your company before today. How do I know you'll still be in business next year to support this?`,
      `${persona}: Your company is too small for us to take a risk on. We need a proven vendor with a long track record.`
    ],
    Authority: [
      `${persona}: I'm interested, but I don't make these decisions alone. My boss will never approve this without more justification.`,
      `${persona}: This looks good, but I'll need to run it by our procurement team and they're very particular about vendors.`
    ],
    Competition: [
      `${persona}: I'm already talking to [Competitor] and they're offering me a better deal. What makes you different?`,
      `${persona}: Your competitor just quoted me 25% less for the same features. Can you match their price?`
    ],
    Need: [
      `${persona}: I'm not convinced we actually need this. We've been doing fine without it for years. Why change now?`,
      `${persona}: This seems like a nice-to-have, not a must-have. We have bigger priorities right now.`
    ]
  };
  
  const objections = initialObjections[scenario.objection as keyof typeof initialObjections] || initialObjections.Need;
  return objections[Math.floor(Math.random() * objections.length)];
}

// New function to analyze user response and provide contextual feedback
function analyzeUserResponse(userInput: string, scenario: Scenario, persona: string, conversationHistory: Message[]): string {
  const lowerInput = userInput.toLowerCase();
  const inputLength = userInput.trim().length;
  
  // Analyze response characteristics
  const hasEmpathy = lowerInput.includes('understand') || lowerInput.includes('hear') || lowerInput.includes('appreciate');
  const hasSpecifics = lowerInput.includes('example') || lowerInput.includes('specifically') || lowerInput.includes('case study');
  const hasValue = lowerInput.includes('value') || lowerInput.includes('benefit') || lowerInput.includes('roi');
  const hasQuestions = userInput.includes('?');
  const isVeryShort = inputLength < 20;
  const isGeneric = lowerInput.includes('great question') || lowerInput.includes('good point');
  
  // Get the last AI message to understand context
  const lastAIMessage = conversationHistory.filter(msg => msg.sender === 'ai').pop();
  const objectionType = scenario.objection;
  
  // Provide contextual feedback based on user's actual response
  if (isVeryShort && lowerInput.includes('understand')) {
    return `${persona}: Thanks for acknowledging that. What might help me feel more confident about moving forward is understanding how this specifically addresses my ${objectionType.toLowerCase()} concern. Can you walk me through that?`;
  }
  
  if (isGeneric || isVeryShort) {
    return `${persona}: I appreciate that, but I need more than just reassurance. Can you give me something concrete that addresses my specific concern about ${objectionType.toLowerCase()}?`;
  }
  
  if (hasEmpathy && hasSpecifics) {
    const positiveResponses = [
      `${persona}: That's helpful - I can see you understand my position and you've given me something concrete to consider. Let me think about this... Actually, I have another concern: what about the implementation timeline?`,
      `${persona}: You've made a good point there, and I appreciate the specific example. That does help address my concern. However, I'm still wondering about the long-term support - what happens if things go wrong?`,
      `${persona}: Okay, that's more convincing. You've shown you understand my situation and provided real evidence. I'm starting to see the value, but I need to understand the next steps better.`
    ];
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }
  
  if (hasEmpathy && !hasSpecifics) {
    return `${persona}: I can tell you're listening to my concerns, which I appreciate. But I still need to see some concrete evidence or examples of how this has worked for others in similar situations. Can you share something specific?`;
  }
  
  if (hasSpecifics && !hasEmpathy) {
    return `${persona}: The information you've shared is useful, but I feel like you jumped straight into your pitch without really acknowledging my concern. I need to feel heard before I can consider the solution.`;
  }
  
  if (hasQuestions) {
    return `${persona}: Good - you're asking the right questions to understand my situation better. ${generateDiscoveryResponse(objectionType, scenario.difficulty)}`;
  }
  
  // Default contextual response based on objection type
  const objectionSpecificResponses = {
    Price: `${persona}: You haven't really addressed why I should pay more when I have cheaper options. I need to see clear ROI or unique value that justifies the premium.`,
    Timing: `${persona}: You haven't convinced me why this can't wait. What's the urgency? What am I missing out on by waiting six months?`,
    Trust: `${persona}: I still don't know enough about your company's track record. Can you share some references or case studies from similar clients?`,
    Authority: `${persona}: That doesn't help me with my boss. I need ammunition - specific benefits and ROI data that will convince the decision maker.`,
    Competition: `${persona}: You still haven't differentiated yourself from the competition. What makes you worth considering over the other options I'm evaluating?`,
    Need: `${persona}: I'm still not convinced this is a priority. You need to help me see what problems this solves that I might not be aware of.`
  };
  
  return objectionSpecificResponses[objectionType as keyof typeof objectionSpecificResponses] || 
         `${persona}: I need more information to feel comfortable moving forward. Can you help me understand this better?`;
}

// Helper function for discovery responses
function generateDiscoveryResponse(objectionType: string, difficulty: string): string {
  const responses = {
    Price: "Tell me more about your current budget constraints and what ROI you'd need to see to justify this investment.",
    Timing: "Help me understand what other priorities you're managing right now and what would need to change for this to become urgent.",
    Trust: "What would you need to see from us to feel confident in our ability to deliver and support you long-term?",
    Authority: "Walk me through your decision-making process - who else needs to be involved and what concerns might they have?",
    Competition: "What criteria are you using to evaluate your options, and what's most important to you in making this decision?",
    Need: "Tell me more about your current process and what challenges, if any, you're experiencing with it."
  };
  
  return responses[objectionType as keyof typeof responses] || "What questions do you have about how this might work for your specific situation?";
}

/**
 * Generates enhanced feedback for objection handling responses
 * @param transcription User's transcribed response to objection
 * @param objectionType Type of objection being handled
 * @param industryContext User's industry context
 * @returns Structured feedback with positive reinforcement and specific guidance
 */
export const generateEnhancedFeedback = (
  transcription: string,
  objectionType: string,
  industryContext: string = 'general'
) => {
  // Analysis logic here (simplified for example)
  const strengths = analyzeStrengths(transcription, objectionType);
  const improvements = analyzeImprovements(transcription, objectionType);
  const industrySpecificTips = getIndustrySpecificTips(objectionType, industryContext);
  const relevantMethodology = getSuggestedMethodology(objectionType);
  
  // Structure feedback using the "sandwich method"
  return {
    positiveOpening: {
      title: "What You Did Well",
      points: strengths.slice(0, 2),
      encouragement: getEncouragementPhrase()
    },
    improvementSuggestions: {
      title: "Opportunities to Enhance",
      points: improvements.slice(0, 2),
      methodology: {
        name: relevantMethodology.name,
        technique: relevantMethodology.techniques[objectionType],
        example: relevantMethodology.examples[objectionType]
      },
      industryContext: industrySpecificTips
    },
    positiveClosing: {
      title: "Your Strengths to Build On",
      points: strengths.slice(2, 3),
      nextStepSuggestion: getNextStepSuggestion(improvements)
    },
    progressMetrics: {
      improvement: calculateImprovementPercentage(),
      consistentStrengths: identifyConsistentStrengths(),
      focusAreas: identifyFocusAreas()
    }
  };
};

const analyzeStrengths = (transcription: string, objectionType: string): string[] => {
  // Simplified analysis - in a real implementation, this would use NLP/AI
  const strengths = [];
  
  if (transcription.includes('understand') || transcription.includes('hear')) {
    strengths.push('Good use of empathy and acknowledgment');
  }
  
  if (transcription.includes('example') || transcription.includes('specifically')) {
    strengths.push('Provided concrete examples');
  }
  
  if (transcription.includes('value') || transcription.includes('benefit')) {
    strengths.push('Focused on value proposition');
  }
  
  if (transcription.includes('question') || transcription.includes('?')) {
    strengths.push('Used discovery questions effectively');
  }
  
  return strengths.length > 0 ? strengths : ['Showed persistence in addressing the objection'];
};

const analyzeImprovements = (transcription: string, objectionType: string): string[] => {
  const improvements = [];
  
  if (!transcription.includes('understand') && !transcription.includes('hear')) {
    improvements.push('Consider acknowledging the customer\'s concern first');
  }
  
  if (!transcription.includes('example') && !transcription.includes('specifically')) {
    improvements.push('Add specific examples or case studies');
  }
  
  if (transcription.length < 50) {
    improvements.push('Provide more detailed explanations');
  }
  
  if (!transcription.includes('?')) {
    improvements.push('Ask discovery questions to understand the root concern');
  }
  
  return improvements.length > 0 ? improvements : ['Continue building confidence in your delivery'];
};

const getIndustrySpecificTips = (objectionType: string, industryContext: string): string[] => {
  const tips = {
    'Technology': ['Focus on ROI and implementation timeline', 'Highlight security and compliance features'],
    'Healthcare': ['Emphasize patient care improvements', 'Address regulatory compliance'],
    'Finance': ['Stress security and risk mitigation', 'Provide clear compliance documentation'],
    'Retail': ['Focus on customer experience impact', 'Highlight inventory and sales benefits']
  };
  
  return tips[industryContext] || ['Tailor your response to their specific industry needs'];
};

const getSuggestedMethodology = (objectionType: string) => {
  // This would reference the actual salesMethodologies data
  return {
    name: 'SPIN Selling',
    techniques: {
      [objectionType]: 'Use situation and problem questions to uncover the root cause'
    },
    examples: {
      [objectionType]: 'What specific challenges is this creating for your team right now?'
    }
  };
};

const getEncouragementPhrase = (): string => {
  const phrases = [
    'Great foundation to build upon!',
    'Strong approach - let\'s refine it further',
    'You\'re on the right track!',
    'Solid effort - here\'s how to make it even better'
  ];
  
  return phrases[Math.floor(Math.random() * phrases.length)];
};

const getNextStepSuggestion = (improvements: string[]): string => {
  if (improvements.length > 0) {
    return `Focus on: ${improvements[0]}`;
  }
  return 'Continue practicing to build consistency';
};

const calculateImprovementPercentage = (): number => {
  // Simplified calculation - would track actual progress over time
  return Math.floor(Math.random() * 20) + 75; // 75-95%
};

const identifyConsistentStrengths = (): string[] => {
  return ['Active listening', 'Professional communication'];
};

const identifyFocusAreas = (): string[] => {
  return ['Objection handling', 'Value articulation'];
};
