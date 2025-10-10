
interface FeedbackData {
  score: number;
  tone: {
    rating: number;
    feedback: string;
  };
  clarity: {
    rating: number;
    feedback: string;
  };
  objectionHandling: {
    rating: number;
    feedback: string;
  };
  strengths: string[];
  improvements: string[];
  idealResponse: string;
}

export const generateStructuredFeedback = (
  userInput: string,
  objectionType: string,
  conversationHistory: any[] = []
): FeedbackData => {
  const lowerInput = userInput.toLowerCase().trim();
  const inputLength = userInput.length;
  
  // Analyze response characteristics
  const hasEmpathy = lowerInput.includes('understand') || lowerInput.includes('hear') || 
                     lowerInput.includes('appreciate') || lowerInput.includes('feel');
  const hasSpecifics = lowerInput.includes('example') || lowerInput.includes('specifically') || 
                       lowerInput.includes('case study') || lowerInput.includes('data');
  const hasValue = lowerInput.includes('value') || lowerInput.includes('benefit') || 
                   lowerInput.includes('roi') || lowerInput.includes('save');
  const hasQuestions = userInput.includes('?');
  const isDetailed = inputLength > 50;
  const isGeneric = lowerInput.includes('great question') || lowerInput.includes('good point');
  
  // Calculate individual ratings
  let toneRating = 60; // Base score
  let clarityRating = 60;
  let objectionRating = 60;
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Tone & Empathy Assessment
  if (hasEmpathy) {
    toneRating += 20;
    strengths.push('Showed empathy and acknowledged the customer\'s concern');
  } else {
    improvements.push('Start by acknowledging the customer\'s concern with phrases like "I understand" or "I hear you"');
  }
  
  if (!isGeneric && inputLength > 30) {
    toneRating += 10;
  } else if (isGeneric) {
    toneRating -= 15;
    improvements.push('Avoid generic responses like "great question" - be more personal and specific');
  }
  
  // Clarity & Specificity Assessment
  if (hasSpecifics) {
    clarityRating += 25;
    strengths.push('Provided specific examples or concrete evidence');
  } else {
    improvements.push('Include specific examples, case studies, or data to support your points');
  }
  
  if (isDetailed) {
    clarityRating += 10;
    strengths.push('Gave a detailed, thoughtful response');
  } else {
    improvements.push('Provide more detailed explanations to build credibility');
  }
  
  // Objection Handling Assessment
  if (hasEmpathy && hasSpecifics) {
    objectionRating += 25;
    strengths.push('Used the acknowledge-reframe-engage approach effectively');
  } else if (hasEmpathy && !hasSpecifics) {
    objectionRating += 10;
    improvements.push('After acknowledging, provide concrete evidence to address the concern');
  } else if (!hasEmpathy && hasSpecifics) {
    objectionRating += 10;
    improvements.push('Acknowledge the concern first before jumping into your solution');
  }
  
  if (hasQuestions) {
    objectionRating += 15;
    strengths.push('Asked discovery questions to better understand the situation');
  } else {
    improvements.push('Ask questions to uncover the root cause of their concern');
  }
  
  if (hasValue) {
    objectionRating += 10;
    strengths.push('Focused on value and benefits rather than just features');
  }
  
  // Cap ratings at 100
  toneRating = Math.min(toneRating, 100);
  clarityRating = Math.min(clarityRating, 100);
  objectionRating = Math.min(objectionRating, 100);
  
  // Calculate overall score
  const overallScore = Math.round((toneRating + clarityRating + objectionRating) / 3);
  
  // Generate ideal response based on objection type
  const idealResponses = {
    Price: "I completely understand your budget concerns - that's actually one of the most common questions we get. What most clients find is the ROI typically outweighs the cost within 3-4 months. Would it be helpful if I showed you exactly how the numbers work for a company your size?",
    Trust: "I totally get the skepticism - you should be cautious about new solutions. We've actually helped over 200 companies in your industry achieve similar results. Would it help to speak with a current client who was in your exact situation six months ago?",
    Timing: "That makes perfect sense - timing is everything in business. The interesting thing is, this actually saves most teams 5-10 hours per week once implemented. What's driving the time crunch right now - maybe this could actually help with that?",
    Authority: "Absolutely - important decisions should involve the right people. I've helped many professionals present this to their leadership successfully. What information would be most helpful for your conversation with them?",
    Competition: "Smart approach - you should evaluate all your options. Since you're already investing time in research, let me save you some effort. What specific criteria are you using to compare solutions?",
    Need: "I respect that - you shouldn't change what's working. Many of our best clients felt the same way initially. What if I could show you one specific area where this might eliminate a current pain point?"
  };
  
  const idealResponse = idealResponses[objectionType as keyof typeof idealResponses] || 
    "I understand your concern. Let me address that with a specific example of how we've helped similar clients overcome this exact challenge. Would that be helpful?";
  
  return {
    score: overallScore,
    tone: {
      rating: toneRating,
      feedback: hasEmpathy ? 'Good empathy and acknowledgment' : 'Could improve acknowledgment of customer concerns'
    },
    clarity: {
      rating: clarityRating,
      feedback: hasSpecifics ? 'Clear and specific response' : 'Could be more specific with examples and evidence'
    },
    objectionHandling: {
      rating: objectionRating,
      feedback: hasEmpathy && hasSpecifics ? 'Strong objection handling technique' : 'Consider using acknowledge-reframe-engage approach'
    },
    strengths,
    improvements,
    idealResponse
  };
};
