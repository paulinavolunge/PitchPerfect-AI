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
    return `${getAIPersona()}: Hello! I'm ready to roleplay your custom scenario. I'll respond to your script points as a potential client. Let's begin!`;
  }
  
  const intros = {
    Technology: "Hi there! I'm considering a new software solution for my team. I've heard about your product, but I'm not convinced it's worth the investment.",
    Retail: "Hello, I'm browsing today and noticed your product. I'm interested but have a few concerns before making a purchase.",
    Healthcare: "Hi, our medical practice is looking to upgrade our systems. I've been tasked with reviewing options.",
    Finance: "Hello, I'm looking to possibly switch financial services. What makes your offering different?",
    Manufacturing: "Good day, I'm the procurement manager at our manufacturing company. We're evaluating several options in your space.",
    Education: "Hi there, our educational institution is looking for new solutions. I'm interested to learn more about what you offer."
  };
  
  const objectionHints = {
    Price: "though I'm concerned about the cost",
    Timing: "but I don't see why we need to decide quickly", 
    Trust: "though I'm not familiar with your company's track record",
    Authority: "but I'm not the final decision maker",
    Competition: "and I'm also talking to your competitors",
    Need: "though I'm not convinced we need this solution"
  };
  
  let intro = intros[scenario.industry as keyof typeof intros] || intros.Technology;
  intro += ` I'm interested to learn more, ${objectionHints[scenario.objection as keyof typeof objectionHints] || objectionHints.Need}.`;
  
  return `${getAIPersona()}: ${intro}`;
};

export const generateAIResponse = async (
  userInput: string, 
  scenario: Scenario, 
  userScript: string | null, 
  getAIPersona: () => string,
  conversationHistory: Message[] = []
): Promise<string> => {
  const persona = getAIPersona();
  
  console.log("Generating AI response using OpenAI API for input:", userInput);
  
  // Content safety check for user input
  const safetyAnalysis = ContentSafetyAnalyzer.analyzeContent(userInput, 'USER_MESSAGE');
  if (safetyAnalysis.blocked) {
    console.warn('User input blocked by content safety:', safetyAnalysis.issues);
    return `${persona}: I'm sorry, but I can't respond to that type of content. Let's keep our conversation professional and focused on sales practice.`;
  }

  // Use sanitized input if available
  const safeUserInput = safetyAnalysis.sanitizedContent || userInput;
  
  try {
    // Call the secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('roleplay-ai-response', {
      body: {
        userInput: safeUserInput,
        scenario: scenario,
        voiceStyle: getVoiceStyleFromPersona(persona),
        userScript: userScript,
        conversationHistory: conversationHistory.slice(-6) // Last 6 messages for context
      }
    });

    if (error) {
      console.error('Error calling roleplay AI function:', error);
      throw new Error(error.message);
    }

    if (!data || !data.response) {
      throw new Error('No response received from AI service');
    }

    const aiResponse = `${persona}: ${data.response}`;
    
    // Safety check for AI output
    const outputSafety = ContentSafetyAnalyzer.analyzeAIOutput(aiResponse);
    if (outputSafety.blocked) {
      return `${persona}: I apologize, but I need to adjust my response. Let me try a different approach to address your concern.`;
    }
    
    return outputSafety.sanitizedContent || aiResponse;

  } catch (error) {
    console.error('Failed to generate AI response:', error);
    
    // Fallback to local response generation
    return generateFallbackResponse(userInput, scenario, persona);
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

// Fallback response generation for when API fails
function generateFallbackResponse(userInput: string, scenario: Scenario, persona: string): string {
  console.log("Using fallback response generation");
  
  const lowerInput = userInput.toLowerCase();
  
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
    return `${persona}: We respect our competitors, but there are key differences in our approach. Our solution includes features that others don't offer. Have you had a chance to evaluate those specific differences?`;
  }
  
  if (lowerInput.includes('time') || lowerInput.includes('urgent') || lowerInput.includes('wait')) {
    if (scenario.objection === 'Timing') {
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
