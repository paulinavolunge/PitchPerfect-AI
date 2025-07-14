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
  if (scenario.custom) {
    return `${getAIPersona()}: Hello! I'm ready to roleplay your custom scenario. I'll present objections as a potential client, and you can practice overcoming them. Let's begin!`;
  }
  
  const intros = {
    Technology: "Hi there! I've been looking at your software solution, but I'm not convinced it's worth the investment right now.",
    Retail: "Hello, I'm interested in your product, but I have some concerns before making a purchase.",
    Healthcare: "Hi, our medical practice is considering new systems, but I'm not sure this is the right fit for us.",
    Finance: "Hello, I'm evaluating financial services, but I'm not ready to make any changes yet.",
    Manufacturing: "Good day, I'm reviewing options for our manufacturing company, but we're not in a hurry to decide.",
    Education: "Hi there, our educational institution is looking at solutions, but budget is a major concern for us."
  };
  
  const objectionStatements = {
    Price: "The cost seems too high for what we're getting. I can find cheaper alternatives elsewhere.",
    Timing: "This isn't a priority right now. We have other things to focus on first.", 
    Trust: "I've never heard of your company before. How do I know you'll be around in a year?",
    Authority: "I'm not the decision maker here. My boss would never approve this.",
    Competition: "I'm already talking to your competitors and they're offering better deals.",
    Need: "I'm not convinced we actually need this solution. We're doing fine without it."
  };
  
  const intro = intros[scenario.industry as keyof typeof intros] || intros.Technology;
  const objection = objectionStatements[scenario.objection as keyof typeof objectionStatements] || objectionStatements.Need;
  
  return `${getAIPersona()}: ${intro} ${objection} What do you have to say about that?`;
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
    // Analyze their objection handling response
    const feedbackResponses = {
      Beginner: [
        `${persona}: That's a good start! I appreciate that you acknowledged my concern. However, I'd like to see more specific examples of how your solution addresses my objection. Can you give me concrete proof?`,
        `${persona}: I hear what you're saying, but I'm still not fully convinced. You made some good points, but I need more details about the value proposition.`,
        `${persona}: That's helpful information. I'm starting to see the benefits, but I still have some reservations about moving forward right now.`
      ],
      Intermediate: [
        `${persona}: You handled that well by addressing my concern directly. But now I'm wondering - what happens if this doesn't work out as promised? What guarantees do you offer?`,
        `${persona}: I appreciate the detailed explanation. You're making me reconsider, but I need to understand the implementation process better before I can commit.`,
        `${persona}: That was a solid response. You've addressed some of my concerns, but let me throw another objection at you - what about the learning curve for my team?`
      ],
      Advanced: [
        `${persona}: Excellent objection handling! You used evidence and addressed my specific concern. However, I'm still comparing you to competitors who offer similar value at a lower price point.`,
        `${persona}: That was very persuasive. You've clearly done your homework. But I'm curious - how do you handle clients who aren't seeing the ROI you promised after 6 months?`,
        `${persona}: Well done! You turned my objection into a selling point. Now I'm interested, but I need to understand your onboarding process and what support looks like long-term.`
      ]
    };
    
    const responses = feedbackResponses[scenario.difficulty as keyof typeof feedbackResponses] || feedbackResponses.Beginner;
    return responses[Math.floor(Math.random() * responses.length)];
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
