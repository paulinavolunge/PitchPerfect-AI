
export interface ObjectionType {
  type: 'price' | 'time' | 'authority' | 'trust' | 'brush-off' | 'none';
  confidence: number;
  keywords: string[];
}

export interface ObjectionResponse {
  acknowledge: string;
  reframe: string;
  engage: string;
}

class ObjectionDetectionService {
  private objectionPatterns = {
    price: {
      keywords: [
        'expensive', 'cost', 'price', 'budget', 'money', 'afford', 'cheap',
        'costly', 'investment', 'worth', 'value', 'roi', 'return',
        'too much', 'overpriced', 'break the bank', 'financial'
      ],
      phrases: [
        'too expensive', 'not worth it', 'costs too much', 'out of budget',
        'can\'t afford', 'price is high', 'too pricey', 'need cheaper'
      ]
    },
    time: {
      keywords: [
        'busy', 'time', 'later', 'timing', 'schedule', 'rush', 'hurry',
        'priority', 'urgent', 'deadline', 'calendar', 'available'
      ],
      phrases: [
        'not the right time', 'too busy', 'bad timing', 'call back later',
        'not now', 'maybe later', 'no time', 'wrong time'
      ]
    },
    authority: {
      keywords: [
        'boss', 'manager', 'team', 'committee', 'decision', 'approve',
        'permission', 'check with', 'discuss', 'board', 'supervisor'
      ],
      phrases: [
        'need to check with', 'not my decision', 'talk to my boss',
        'need approval', 'team decision', 'discuss with team'
      ]
    },
    trust: {
      keywords: [
        'trust', 'scam', 'skeptical', 'doubt', 'suspicious', 'guarantee',
        'proof', 'evidence', 'results', 'track record', 'reputation'
      ],
      phrases: [
        'sounds too good', 'never heard of', 'don\'t trust', 'seems fishy',
        'not sure it works', 'prove it works', 'show me results'
      ]
    },
    'brush-off': {
      keywords: [
        'think about', 'consider', 'research', 'compare', 'options',
        'looking around', 'shopping', 'exploring', 'browsing'
      ],
      phrases: [
        'just looking', 'send me info', 'think about it', 'not interested',
        'call back', 'maybe later', 'just browsing', 'need to research'
      ]
    }
  };

  detectObjection(input: string): ObjectionType {
    const normalizedInput = input.toLowerCase().trim();
    const scores: Record<string, number> = {
      price: 0,
      time: 0,
      authority: 0,
      trust: 0,
      'brush-off': 0
    };

    const detectedKeywords: string[] = [];

    // Check for exact phrase matches (higher weight)
    Object.entries(this.objectionPatterns).forEach(([type, patterns]) => {
      patterns.phrases.forEach(phrase => {
        if (normalizedInput.includes(phrase)) {
          scores[type] += 3;
          detectedKeywords.push(phrase);
        }
      });
    });

    // Check for keyword matches
    Object.entries(this.objectionPatterns).forEach(([type, patterns]) => {
      patterns.keywords.forEach(keyword => {
        if (normalizedInput.includes(keyword)) {
          scores[type] += 1;
          if (!detectedKeywords.includes(keyword)) {
            detectedKeywords.push(keyword);
          }
        }
      });
    });

    // Find highest scoring objection type
    const maxScore = Math.max(...Object.values(scores));
    const detectedType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'none';

    // Calculate confidence based on score and input length
    const confidence = maxScore > 0 ? Math.min(maxScore / (normalizedInput.split(' ').length * 0.5), 1) : 0;

    return {
      type: confidence > 0.3 ? (detectedType as ObjectionType['type']) : 'none',
      confidence,
      keywords: detectedKeywords
    };
  }

  generateObjectionResponse(objectionType: ObjectionType['type'], industry: string = 'general'): ObjectionResponse {
    const responses = {
      price: {
        acknowledge: [
          "That's a completely fair concern — a lot of smart business owners ask the same thing.",
          "I totally understand the budget consideration — it's actually one of the most common questions we get.",
          "You're absolutely right to think about the investment — that shows good business sense."
        ],
        reframe: [
          "What most find is the ROI usually outweighs the cost within a few months.",
          "Many of our clients say they wish they'd started sooner because of how quickly it paid for itself.",
          "The cost of not having this solution often ends up being much higher than the investment."
        ],
        engage: [
          "Would it be helpful if I walked you through how the numbers usually play out?",
          "What would need to happen for this to be a no-brainer investment for you?",
          "If I could show you how to get a 300% return in 6 months, would that change your perspective?"
        ]
      },
      time: {
        acknowledge: [
          "I completely get it — everyone's swamped these days.",
          "That makes total sense — timing is everything in business.",
          "I hear you — finding the right time for new initiatives is always challenging."
        ],
        reframe: [
          "The interesting thing is, this actually saves most people 5-10 hours per week once it's set up.",
          "Many clients tell us they couldn't afford NOT to implement this because of how much time it saves.",
          "We've designed the onboarding to take just 30 minutes, specifically for busy professionals like yourself."
        ],
        engage: [
          "When would be a better time to revisit this — next quarter?",
          "What if I could show you how to get this up and running in just 15 minutes?",
          "What's driving the time crunch right now — maybe this could actually help with that?"
        ]
      },
      authority: {
        acknowledge: [
          "That makes perfect sense — important decisions should involve the right people.",
          "I appreciate you being upfront about the decision-making process.",
          "Absolutely — getting buy-in from the team is crucial for success."
        ],
        reframe: [
          "Most decision-makers love when their team brings them well-researched solutions.",
          "I've helped many professionals present this to their leadership team successfully.",
          "The best implementations happen when everyone's on board from the start."
        ],
        engage: [
          "What information would be most helpful for your conversation with them?",
          "Who else would need to be involved in this decision?",
          "Would it be helpful if I put together a brief summary you could share with your team?"
        ]
      },
      trust: {
        acknowledge: [
          "I totally understand the skepticism — you should be cautious about new solutions.",
          "That's a smart approach — due diligence is important.",
          "I appreciate your honesty — trust has to be earned."
        ],
        reframe: [
          "We've helped over 500 companies in your industry achieve similar results.",
          "All our clients start with a risk-free trial specifically to address these concerns.",
          "I'd rather show you proof than just talk about it — results speak louder than promises."
        ],
        engage: [
          "What would you need to see to feel confident this would work for you?",
          "Would it help to speak with a current client in your industry?",
          "What's been your experience with similar solutions in the past?"
        ]
      },
      'brush-off': {
        acknowledge: [
          "That's a smart approach — doing your research is always wise.",
          "I respect that — taking time to evaluate options shows good judgment.",
          "That makes sense — important decisions shouldn't be rushed."
        ],
        reframe: [
          "Most of our best clients took time to research us before moving forward.",
          "The good news is, we've made it easy to try risk-free while you're evaluating options.",
          "Since you're already investing time in research, let me save you some effort."
        ],
        engage: [
          "What specific information would be most helpful for your research?",
          "What other solutions are you comparing us against?",
          "What would make this an obvious choice for you?"
        ]
      }
    };

    if (objectionType === 'none') {
      return {
        acknowledge: "That's helpful to know.",
        reframe: "I want to make sure I understand your situation completely.",
        engage: "Would you mind sharing a bit more about your concerns so I can better help?"
      };
    }

    const objectionResponses = responses[objectionType];
    return {
      acknowledge: this.getRandomItem(objectionResponses.acknowledge),
      reframe: this.getRandomItem(objectionResponses.reframe),
      engage: this.getRandomItem(objectionResponses.engage)
    };
  }

  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  formatResponse(response: ObjectionResponse): string {
    return `${response.acknowledge} ${response.reframe} ${response.engage}`;
  }
}

export const objectionDetectionService = new ObjectionDetectionService();
