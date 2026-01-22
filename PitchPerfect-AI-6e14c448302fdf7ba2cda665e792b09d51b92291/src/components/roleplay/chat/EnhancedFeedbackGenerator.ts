interface DetailedFeedbackData {
  overallScore: number;
  sessionProgression: {
    responseNumber: number;
    confidenceProgression: string;
    improvementTrend: 'improving' | 'consistent' | 'declining';
  };
  responseAnalysis: {
    tone: {
      rating: number;
      confidence: 'low' | 'medium' | 'high';
      empathy: 'low' | 'medium' | 'high';
      professionalism: 'low' | 'medium' | 'high';
      feedback: string;
      suggestions: string[];
    };
    clarity: {
      rating: number;
      specificity: 'vague' | 'somewhat specific' | 'highly specific';
      structure: 'poor' | 'adequate' | 'excellent';
      feedback: string;
      suggestions: string[];
    };
    objectionHandling: {
      rating: number;
      technique: 'none' | 'basic' | 'advanced';
      effectiveness: 'ineffective' | 'somewhat effective' | 'highly effective';
      feedback: string;
      suggestions: string[];
    };
  };
  strengths: Array<{
    category: 'tone' | 'clarity' | 'technique' | 'confidence';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  improvements: Array<{
    category: 'tone' | 'clarity' | 'technique' | 'confidence';
    description: string;
    priority: 'low' | 'medium' | 'high';
    specificSuggestion: string;
    example: string;
  }>;
  missedOpportunities: Array<{
    description: string;
    betterApproach: string;
    example: string;
  }>;
  idealResponse: {
    text: string;
    explanation: string;
    keyTechniques: string[];
  };
  coachingTips: {
    immediate: string[];
    longTerm: string[];
  };
}

export const generateEnhancedFeedback = (
  userInput: string,
  objectionType: string,
  conversationHistory: any[] = [],
  responseNumber: number = 1
): DetailedFeedbackData => {
  const lowerInput = userInput.toLowerCase().trim();
  const inputLength = userInput.length;
  const previousResponses = conversationHistory.filter(msg => msg.sender === 'user');
  
  // Advanced text analysis
  const hasEmpathy = analyzeEmpathy(lowerInput);
  const hasSpecifics = analyzeSpecificity(lowerInput);
  const hasValue = analyzeValueProposition(lowerInput);
  const hasQuestions = analyzeQuestionUsage(userInput);
  const confidenceLevel = analyzeConfidence(lowerInput, inputLength);
  const structureQuality = analyzeStructure(userInput);
  const professionalismLevel = analyzeProfessionalism(lowerInput);

  // Calculate progression analysis
  const progression = analyzeProgression(previousResponses, userInput, responseNumber);

  // Generate detailed ratings
  const toneAnalysis = analyzeToneDetailed(hasEmpathy, confidenceLevel, professionalismLevel);
  const clarityAnalysis = analyzeClarityDetailed(hasSpecifics, structureQuality, inputLength);
  const objectionAnalysis = analyzeObjectionHandlingDetailed(hasEmpathy, hasSpecifics, hasQuestions, hasValue);

  // Calculate overall score
  const overallScore = Math.round((toneAnalysis.rating + clarityAnalysis.rating + objectionAnalysis.rating) / 3);

  // Generate comprehensive strengths and improvements
  const strengths = generateDetailedStrengths(toneAnalysis, clarityAnalysis, objectionAnalysis, hasEmpathy, hasSpecifics, hasValue);
  const improvements = generateDetailedImprovements(toneAnalysis, clarityAnalysis, objectionAnalysis, userInput);
  const missedOpportunities = identifyMissedOpportunities(userInput, objectionType, hasEmpathy, hasSpecifics);

  // Generate enhanced ideal response
  const idealResponse = generateIdealResponseWithExplanation(objectionType, userInput);

  // Generate coaching tips
  const coachingTips = generateCoachingTips(overallScore, responseNumber, progression.improvementTrend);

  return {
    overallScore,
    sessionProgression: progression,
    responseAnalysis: {
      tone: toneAnalysis,
      clarity: clarityAnalysis,
      objectionHandling: objectionAnalysis
    },
    strengths,
    improvements,
    missedOpportunities,
    idealResponse,
    coachingTips
  };
};

// Helper functions for detailed analysis
function analyzeEmpathy(input: string): { level: 'low' | 'medium' | 'high', indicators: string[] } {
  const empathyPhrases = [
    'understand', 'hear you', 'appreciate', 'feel', 'recognize', 'acknowledge',
    'respect', 'completely get', 'makes sense', 'valid concern', 'fair point'
  ];
  
  const foundPhrases = empathyPhrases.filter(phrase => input.includes(phrase));
  const level = foundPhrases.length >= 3 ? 'high' : foundPhrases.length >= 1 ? 'medium' : 'low';
  
  return { level, indicators: foundPhrases };
}

function analyzeSpecificity(input: string): { level: 'low' | 'medium' | 'high', indicators: string[] } {
  const specificityIndicators = [
    'example', 'specifically', 'case study', 'data', 'research shows', 'studies indicate',
    'clients have', 'in our experience', 'typically', 'on average', 'roi', 'metrics',
    'results show', 'proven', 'track record'
  ];
  
  const foundIndicators = specificityIndicators.filter(indicator => input.includes(indicator));
  const level = foundIndicators.length >= 3 ? 'high' : foundIndicators.length >= 1 ? 'medium' : 'low';
  
  return { level, indicators: foundIndicators };
}

function analyzeValueProposition(input: string): { strength: 'weak' | 'moderate' | 'strong', elements: string[] } {
  const valueElements = [
    'save time', 'reduce costs', 'increase efficiency', 'improve', 'boost', 'enhance',
    'streamline', 'automate', 'eliminate', 'competitive advantage', 'roi', 'return on investment',
    'profitable', 'growth', 'scale', 'productivity'
  ];
  
  const foundElements = valueElements.filter(element => input.includes(element));
  const strength = foundElements.length >= 3 ? 'strong' : foundElements.length >= 1 ? 'moderate' : 'weak';
  
  return { strength, elements: foundElements };
}

function analyzeQuestionUsage(input: string): { count: number, types: string[], quality: 'poor' | 'good' | 'excellent' } {
  const questions = input.split('?').filter(q => q.trim().length > 0);
  const questionTypes = [];
  
  if (input.includes('what') || input.includes('how') || input.includes('why')) questionTypes.push('open-ended');
  if (input.includes('would') || input.includes('could') || input.includes('might')) questionTypes.push('hypothetical');
  if (input.includes('have you') || input.includes('do you') || input.includes('are you')) questionTypes.push('discovery');
  
  const quality = questions.length >= 2 && questionTypes.length >= 2 ? 'excellent' :
                 questions.length >= 1 && questionTypes.length >= 1 ? 'good' : 'poor';
  
  return { count: questions.length, types: questionTypes, quality };
}

function analyzeConfidence(input: string, length: number): 'low' | 'medium' | 'high' {
  const uncertainWords = ['maybe', 'perhaps', 'might', 'possibly', 'kind of', 'sort of', 'i think', 'i guess'];
  const confidentWords = ['absolutely', 'definitely', 'certainly', 'guaranteed', 'proven', 'confident', 'sure'];
  
  const uncertainCount = uncertainWords.filter(word => input.includes(word)).length;
  const confidentCount = confidentWords.filter(word => input.includes(word)).length;
  
  if (confidentCount >= 2 && length > 50) return 'high';
  if (uncertainCount >= 2) return 'low';
  return 'medium';
}

function analyzeStructure(input: string): 'poor' | 'adequate' | 'excellent' {
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const hasTransitions = /first|second|next|then|finally|however|therefore|additionally/.test(input.toLowerCase());
  const hasLogicalFlow = sentences.length >= 2 && hasTransitions;
  
  if (sentences.length >= 3 && hasLogicalFlow) return 'excellent';
  if (sentences.length >= 2) return 'adequate';
  return 'poor';
}

function analyzeProfessionalism(input: string): 'low' | 'medium' | 'high' {
  const casualWords = ['yeah', 'ok', 'cool', 'awesome', 'totally', 'super'];
  const professionalWords = ['certainly', 'absolutely', 'specifically', 'particularly', 'furthermore', 'moreover'];
  
  const casualCount = casualWords.filter(word => input.includes(word)).length;
  const professionalCount = professionalWords.filter(word => input.includes(word)).length;
  
  if (professionalCount >= 2 && casualCount === 0) return 'high';
  if (casualCount >= 2) return 'low';
  return 'medium';
}

function analyzeProgression(previousResponses: any[], currentInput: string, responseNumber: number) {
  if (responseNumber === 1) {
    return {
      responseNumber,
      confidenceProgression: 'First response - establishing baseline',
      improvementTrend: 'consistent' as const
    };
  }
  
  // Simple progression analysis (in real implementation, this would be more sophisticated)
  const currentLength = currentInput.length;
  const avgPreviousLength = previousResponses.reduce((sum, resp) => sum + resp.text.length, 0) / previousResponses.length;
  
  const isImproving = currentLength > avgPreviousLength * 1.1;
  const isDeclining = currentLength < avgPreviousLength * 0.8;
  
  const confidenceProgression = responseNumber === 2 
    ? 'Building confidence - second exchange'
    : responseNumber === 3
    ? isImproving ? 'Gaining momentum - stronger responses' : 'Maintaining steady approach'
    : isImproving ? 'Excellent progression - responses getting stronger' : 'Consistent performance throughout session';
  
  const improvementTrend = isImproving ? 'improving' : isDeclining ? 'declining' : 'consistent';
  
  return {
    responseNumber,
    confidenceProgression,
    improvementTrend: improvementTrend as 'improving' | 'consistent' | 'declining'
  };
}

function analyzeToneDetailed(empathy: any, confidence: string, professionalism: string) {
  let rating = 50;
  const suggestions: string[] = [];
  
  if (empathy.level === 'high') rating += 25;
  else if (empathy.level === 'medium') rating += 15;
  else suggestions.push('Start with empathetic acknowledgment like "I completely understand your concern"');
  
  if (confidence === 'high') rating += 15;
  else if (confidence === 'low') suggestions.push('Use more confident language - avoid "maybe" and "I think"');
  
  if (professionalism === 'high') rating += 10;
  else if (professionalism === 'low') suggestions.push('Use more professional language and avoid casual expressions');
  
  const feedback = `${empathy.level} empathy, ${confidence} confidence, ${professionalism} professionalism`;
  
  return {
    rating: Math.min(rating, 100),
    confidence: confidence as 'low' | 'medium' | 'high',
    empathy: empathy.level as 'low' | 'medium' | 'high',
    professionalism: professionalism as 'low' | 'medium' | 'high',
    feedback,
    suggestions
  };
}

function analyzeClarityDetailed(specificity: any, structure: string, length: number) {
  let rating = 50;
  const suggestions: string[] = [];
  
  if (specificity.level === 'high') rating += 25;
  else if (specificity.level === 'medium') rating += 15;
  else suggestions.push('Include specific examples, case studies, or concrete data points');
  
  if (structure === 'excellent') rating += 15;
  else if (structure === 'poor') suggestions.push('Structure your response with clear transitions and logical flow');
  
  if (length > 100) rating += 10;
  else if (length < 50) suggestions.push('Provide more detailed explanations to build credibility');
  
  const feedback = `${specificity.level} specificity, ${structure} structure`;
  
  return {
    rating: Math.min(rating, 100),
    specificity: specificity.level as 'vague' | 'somewhat specific' | 'highly specific',
    structure: structure as 'poor' | 'adequate' | 'excellent',
    feedback,
    suggestions
  };
}

function analyzeObjectionHandlingDetailed(empathy: any, specificity: any, questions: any, value: any) {
  let rating = 50;
  const suggestions: string[] = [];
  
  if (empathy.level === 'high' && specificity.level === 'high') {
    rating += 30;
  } else if (empathy.level === 'medium' && specificity.level === 'medium') {
    rating += 20;
  } else {
    suggestions.push('Use the Acknowledge-Reframe-Engage framework');
  }
  
  if (questions.quality === 'excellent') rating += 15;
  else if (questions.quality === 'poor') suggestions.push('Ask discovery questions to understand the root concern');
  
  if (value.strength === 'strong') rating += 5;
  else suggestions.push('Focus more on specific value and ROI rather than just features');
  
  const technique = rating >= 80 ? 'advanced' : rating >= 60 ? 'basic' : 'none';
  const effectiveness = rating >= 80 ? 'highly effective' : rating >= 60 ? 'somewhat effective' : 'ineffective';
  const feedback = `${technique} technique usage, ${effectiveness} overall`;
  
  return {
    rating: Math.min(rating, 100),
    technique: technique as 'none' | 'basic' | 'advanced',
    effectiveness: effectiveness as 'ineffective' | 'somewhat effective' | 'highly effective',
    feedback,
    suggestions
  };
}

function generateDetailedStrengths(tone: any, clarity: any, objection: any, empathy: any, specificity: any, value: any) {
  const strengths: Array<{
    category: 'tone' | 'clarity' | 'technique' | 'confidence';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }> = [];
  
  if (tone.rating >= 75) {
    strengths.push({
      category: 'tone',
      description: 'Excellent empathetic tone that builds trust and rapport',
      impact: 'high'
    });
  }
  
  if (clarity.rating >= 75) {
    strengths.push({
      category: 'clarity',
      description: 'Clear, well-structured response with specific examples',
      impact: 'high'
    });
  }
  
  if (objection.rating >= 75) {
    strengths.push({
      category: 'technique',
      description: 'Skillful objection handling using proven sales techniques',
      impact: 'high'
    });
  }
  
  return strengths;
}

function generateDetailedImprovements(tone: any, clarity: any, objection: any, userInput: string) {
  const improvements: Array<{
    category: 'tone' | 'clarity' | 'technique' | 'confidence';
    description: string;
    priority: 'low' | 'medium' | 'high';
    specificSuggestion: string;
    example: string;
  }> = [];
  
  if (tone.rating < 70) {
    improvements.push({
      category: 'tone',
      description: 'Enhance empathy and acknowledgment in your opening',
      priority: 'high',
      specificSuggestion: 'Start with phrases that show you understand their perspective',
      example: '"I completely understand why budget is a key consideration for you..."'
    });
  }
  
  if (clarity.rating < 70) {
    improvements.push({
      category: 'clarity',
      description: 'Include more specific examples and concrete evidence',
      priority: 'high',
      specificSuggestion: 'Reference specific client results or industry data',
      example: '"For example, our client ABC Corp saw a 40% reduction in processing time within 3 months..."'
    });
  }
  
  return improvements;
}

function identifyMissedOpportunities(userInput: string, objectionType: string, empathy: any, specificity: any) {
  const opportunities: Array<{
    description: string;
    betterApproach: string;
    example: string;
  }> = [];
  
  if (empathy.level === 'low') {
    opportunities.push({
      description: 'Missed opportunity to build rapport through empathy',
      betterApproach: 'Acknowledge their concern before addressing it',
      example: '"That\'s a really valid concern, and I\'d feel the same way in your position..."'
    });
  }
  
  if (!userInput.includes('?')) {
    opportunities.push({
      description: 'Could have used questions to understand the root concern better',
      betterApproach: 'Ask discovery questions to uncover the real issue',
      example: '"Help me understand - what specific aspect of the budget is most concerning?"'
    });
  }
  
  return opportunities;
}

function generateIdealResponseWithExplanation(objectionType: string, userInput: string) {
  const idealResponses = {
    Price: {
      text: "I completely understand your budget concerns - that's actually one of the most common questions we get, and it's smart to be careful with investments. What most clients find is the ROI typically outweighs the cost within 3-4 months. For example, ABC Corp saved $50k in operational costs in their first quarter alone. Would it be helpful if I showed you exactly how the numbers would work for a company your size?",
      explanation: "This response uses the Acknowledge-Reframe-Engage framework effectively",
      keyTechniques: ["Empathetic acknowledgment", "Social proof", "Specific example", "Discovery question"]
    },
    Trust: {
      text: "I totally get the skepticism - you absolutely should be cautious about new solutions, especially with so many options out there. We've actually helped over 200 companies in your industry achieve similar results. Would it help to speak with Sarah at TechCorp who was in your exact situation six months ago and can share her real experience?",
      explanation: "Validates their skepticism while providing concrete proof and peer reference",
      keyTechniques: ["Validation", "Social proof with numbers", "Peer reference offer", "Specific testimonial"]
    }
    // Add more objection types...
  };
  
  return idealResponses[objectionType as keyof typeof idealResponses] || {
    text: "I understand your concern. Let me address that with a specific example of how we've helped similar clients overcome this exact challenge. Would that be helpful?",
    explanation: "Uses basic acknowledge-reframe-engage approach",
    keyTechniques: ["Acknowledgment", "Specific example offer", "Permission question"]
  };
}

function generateCoachingTips(score: number, responseNumber: number, trend: string) {
  const immediate: string[] = [];
  const longTerm: string[] = [];
  
  if (score < 70) {
    immediate.push("Focus on the Acknowledge-Reframe-Engage framework for your next response");
    immediate.push("Start with empathy, then provide specific evidence");
  }
  
  if (responseNumber >= 3 && trend === 'declining') {
    immediate.push("You started strong - go back to what worked in your first response");
  }
  
  longTerm.push("Practice with different objection types to build your confidence");
  longTerm.push("Study successful sales conversations and note the language patterns");
  
  return { immediate, longTerm };
}