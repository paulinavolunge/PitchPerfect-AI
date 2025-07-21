
/**
 * Content Safety and Filtering System
 * Provides comprehensive protection against harmful content and prompt injection
 */

// Content filtering patterns
const HARMFUL_PATTERNS = [
  // Explicit content
  /\b(porn|sex|nude|naked|xxx)\b/gi,
  // Violence and harmful content
  /\b(kill|murder|suicide|bomb|weapon|gun|knife|violence)\b/gi,
  // Hate speech indicators
  /\b(hate|racist|nazi|terrorist)\b/gi,
  // Personal information patterns
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
];

// Prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above|system)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(everything|all|previous|system)/gi,
  /new\s+(instructions?|prompts?|system|rules?)/gi,
  /act\s+as\s+(?:a\s+)?(different|new|another)/gi,
  /pretend\s+(?:to\s+be|you\s+are)/gi,
  /roleplay\s+as/gi,
  /simulate\s+(?:being|a)/gi,
  /override\s+(system|safety|security)/gi,
];

// Character limits for different input types
export const INPUT_LIMITS = {
  PITCH_CONTENT: 2000,
  FEEDBACK_REQUEST: 1000,
  SCENARIO_DESCRIPTION: 500,
  USER_MESSAGE: 1500,
  VOICE_TRANSCRIPT: 3000,
  CUSTOM_PROMPT: 800,
};

// Safety levels
export enum SafetyLevel {
  SAFE = 'safe',
  SUSPICIOUS = 'suspicious',
  HARMFUL = 'harmful',
  BLOCKED = 'blocked'
}

export interface ContentAnalysis {
  level: SafetyLevel;
  confidence: number;
  issues: string[];
  sanitizedContent?: string;
  blocked: boolean;
}

/**
 * Main content safety analyzer
 */
export class ContentSafetyAnalyzer {
  /**
   * Analyze content for safety issues
   */
  static analyzeContent(content: string, contentType: keyof typeof INPUT_LIMITS = 'USER_MESSAGE'): ContentAnalysis {
    if (!content || typeof content !== 'string') {
      return {
        level: SafetyLevel.BLOCKED,
        confidence: 1.0,
        issues: ['Invalid input: Content must be a non-empty string'],
        blocked: true
      };
    }

    const issues: string[] = [];
    let confidence = 0;
    let level = SafetyLevel.SAFE;

    // Check length limits
    const maxLength = INPUT_LIMITS[contentType];
    if (content.length > maxLength) {
      issues.push(`Content exceeds maximum length of ${maxLength} characters`);
      confidence += 0.5;
      level = SafetyLevel.BLOCKED;
    }

    // Check for harmful patterns
    const harmfulMatches = this.detectHarmfulContent(content);
    if (harmfulMatches.length > 0) {
      issues.push(`Potentially harmful content detected: ${harmfulMatches.join(', ')}`);
      confidence += 0.7;
      level = SafetyLevel.HARMFUL;
    }

    // Check for prompt injection attempts
    const injectionAttempts = this.detectPromptInjection(content);
    if (injectionAttempts.length > 0) {
      issues.push(`Prompt injection attempt detected: ${injectionAttempts.join(', ')}`);
      confidence += 0.8;
      level = SafetyLevel.BLOCKED;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(content);
    if (suspiciousPatterns.length > 0) {
      issues.push(`Suspicious patterns detected: ${suspiciousPatterns.join(', ')}`);
      confidence += 0.3;
      if (level === SafetyLevel.SAFE) {
        level = SafetyLevel.SUSPICIOUS;
      }
    }

    // Generate sanitized content if needed
    let sanitizedContent: string | undefined;
    if (level === SafetyLevel.SUSPICIOUS || (level === SafetyLevel.HARMFUL && confidence < 0.8)) {
      sanitizedContent = this.sanitizeContent(content);
    }

    return {
      level,
      confidence: Math.min(confidence, 1.0),
      issues,
      sanitizedContent,
      blocked: level === SafetyLevel.BLOCKED || confidence >= 0.8
    };
  }

  /**
   * Detect harmful content patterns
   */
  private static detectHarmfulContent(content: string): string[] {
    const matches: string[] = [];
    
    HARMFUL_PATTERNS.forEach(pattern => {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found.map(match => match.toLowerCase()));
      }
    });

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Detect prompt injection attempts
   */
  private static detectPromptInjection(content: string): string[] {
    const matches: string[] = [];
    
    INJECTION_PATTERNS.forEach(pattern => {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });

    // Additional heuristics for injection detection
    const lowerContent = content.toLowerCase();
    
    // Check for instruction-like patterns
    if (lowerContent.includes('you are now') || lowerContent.includes('your new role')) {
      matches.push('role reassignment attempt');
    }
    
    // Check for system override attempts
    if (lowerContent.includes('system:') || lowerContent.includes('assistant:')) {
      matches.push('system prompt formatting');
    }

    return [...new Set(matches)];
  }

  /**
   * Detect suspicious patterns that might indicate misuse
   */
  private static detectSuspiciousPatterns(content: string): string[] {
    const suspicious: string[] = [];
    
    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 20) {
      suspicious.push('excessive capitalization');
    }
    
    // Check for repeated characters
    if (/(.)\1{10,}/.test(content)) {
      suspicious.push('repeated character spam');
    }
    
    // Check for multiple special characters
    const specialCharsRatio = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / content.length;
    if (specialCharsRatio > 0.3) {
      suspicious.push('excessive special characters');
    }
    
    return suspicious;
  }

  /**
   * Sanitize content by removing or replacing harmful elements
   */
  private static sanitizeContent(content: string): string {
    let sanitized = content;
    
    // Remove harmful patterns
    HARMFUL_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    });
    
    // Remove potential injection attempts
    INJECTION_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    });
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Quick validation for time-sensitive operations
   */
  static quickValidate(content: string, maxLength: number = 1000): boolean {
    if (!content || content.length > maxLength) return false;
    
    // Quick check for obvious injection attempts
    const quickPatterns = [
      /ignore.*instructions/gi,
      /forget.*everything/gi,
      /act\s+as/gi,
      /pretend/gi
    ];
    
    return !quickPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Analyze AI output for safety before presenting to user
   */
  static analyzeAIOutput(output: string): ContentAnalysis {
    const analysis = this.analyzeContent(output, 'FEEDBACK_REQUEST');
    
    // Additional checks for AI output
    if (output.includes('I cannot') || output.includes('I\'m not able to')) {
      // AI has self-censored, which is good
      analysis.level = SafetyLevel.SAFE;
      analysis.confidence = Math.max(0, analysis.confidence - 0.3);
    }
    
    return analysis;
  }
}

/**
 * Content moderation for user-generated pitch content
 */
export class PitchContentModerator {
  /**
   * Moderate pitch content with business context
   */
  static moderatePitch(pitchContent: string): ContentAnalysis {
    const baseAnalysis = ContentSafetyAnalyzer.analyzeContent(pitchContent, 'PITCH_CONTENT');
    
    // Additional business-specific checks
    const businessIssues: string[] = [];
    
    // Check for inappropriate sales tactics
    const aggressivePatterns = [
      /\b(scam|trick|fool|deceive|lie)\b/gi,
      /\b(pressure|force|must buy now)\b/gi,
      /\b(desperate|urgent|limited time)\b/gi
    ];
    
    aggressivePatterns.forEach(pattern => {
      if (pattern.test(pitchContent)) {
        businessIssues.push('potentially aggressive sales tactics detected');
      }
    });
    
    // Check for unrealistic claims
    const unrealisticPatterns = [
      /\b(guaranteed|100%|never fail|instant)\b/gi,
      /\b(magic|miracle|secret)\b/gi
    ];
    
    unrealisticPatterns.forEach(pattern => {
      if (pattern.test(pitchContent)) {
        businessIssues.push('potentially unrealistic claims detected');
      }
    });
    
    if (businessIssues.length > 0) {
      baseAnalysis.issues.push(...businessIssues);
      if (baseAnalysis.level === SafetyLevel.SAFE) {
        baseAnalysis.level = SafetyLevel.SUSPICIOUS;
      }
      baseAnalysis.confidence += 0.2;
    }
    
    return baseAnalysis;
  }
}

/**
 * Rate limiting for content safety checks
 */
export class SafetyRateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly WINDOW_MS = 60000; // 1 minute

  static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(userId);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      this.attempts.set(userId, { count: 1, resetTime: now + this.WINDOW_MS });
      return true;
    }
    
    if (userAttempts.count >= this.MAX_ATTEMPTS) {
      return false;
    }
    
    userAttempts.count++;
    return true;
  }
}

/**
 * Pitch quality validation for analysis
 */
export class PitchQualityValidator {
  // Minimum requirements for a meaningful pitch analysis
  private static readonly MIN_WORD_COUNT = 10;
  private static readonly MIN_CHAR_COUNT = 50;
  private static readonly MIN_SENTENCES = 2;
  
  // Common low-effort or nonsensical inputs
  private static readonly LOW_EFFORT_PATTERNS = [
    /^[a-zA-Z\s]{1,20}$/, // Very short single words or phrases
    /^(hello|hi|hey|test|demo|sample|pitch|sales|product|service)$/i, // Common test words
    /^[a-zA-Z]{1,5}$/, // Very short words
    /^(a|an|the|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|can)$/i, // Common filler words
    /^[^\w\s]*$/, // Only punctuation/symbols
    /^[a-zA-Z\s]{1,30}$/, // Very short text with only letters and spaces
  ];

  /**
   * Validate pitch content quality for analysis
   */
  static validatePitchQuality(content: string): {
    isValid: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'invalid';
    score: number;
    feedback: string;
    issues: string[];
  } {
    const issues: string[] = [];
    let quality: 'excellent' | 'good' | 'poor' | 'invalid' = 'excellent';
    let score = 100;
    let feedback = '';

    // Basic validation
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        quality: 'invalid',
        score: 0,
        feedback: 'Please provide a valid pitch for analysis.',
        issues: ['No content provided']
      };
    }

    const trimmedContent = content.trim();
    
    // Check for empty or whitespace-only content
    if (!trimmedContent) {
      return {
        isValid: false,
        quality: 'invalid',
        score: 0,
        feedback: 'Please provide a pitch for analysis.',
        issues: ['Empty content']
      };
    }

    // Check character count
    if (trimmedContent.length < this.MIN_CHAR_COUNT) {
      issues.push(`Content too short (${trimmedContent.length} characters, minimum ${this.MIN_CHAR_COUNT})`);
      score -= 40;
    }

    // Check word count
    const words = trimmedContent.split(/\s+/).filter(word => word.length > 0);
    if (words.length < this.MIN_WORD_COUNT) {
      issues.push(`Too few words (${words.length} words, minimum ${this.MIN_WORD_COUNT})`);
      score -= 30;
    }

    // Check sentence count
    const sentences = trimmedContent.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    if (sentences.length < this.MIN_SENTENCES) {
      issues.push(`Too few sentences (${sentences.length} sentences, minimum ${this.MIN_SENTENCES})`);
      score -= 20;
    }

    // Check for low-effort patterns
    const isLowEffort = this.LOW_EFFORT_PATTERNS.some(pattern => pattern.test(trimmedContent));
    if (isLowEffort) {
      issues.push('Content appears to be low-effort or nonsensical');
      score -= 50;
    }

    // Check for repetitive content
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const repetitionRatio = uniqueWords.size / words.length;
    if (words.length > 5 && repetitionRatio < 0.3) {
      issues.push('Content appears repetitive');
      score -= 15;
    }

    // Check for meaningful content indicators
    const hasBusinessTerms = /\b(business|product|service|customer|client|value|benefit|solution|problem|need|want|help|improve|increase|reduce|save|cost|price|quality|feature|advantage|benefit)\b/i.test(trimmedContent);
    const hasActionWords = /\b(can|will|help|provide|offer|give|show|demonstrate|explain|solve|address|meet|exceed|deliver|create|build|develop|improve|enhance|optimize)\b/i.test(trimmedContent);
    
    if (!hasBusinessTerms && !hasActionWords && words.length > 3) {
      issues.push('Content lacks business or action-oriented language');
      score -= 25;
    }

    // Determine quality level and generate feedback
    if (score <= 20) {
      quality = 'invalid';
      feedback = 'Please provide a more substantial pitch for an accurate analysis. Your input appears to be too short or nonsensical.';
    } else if (score <= 50) {
      quality = 'poor';
      feedback = 'Your pitch needs significant improvement. Consider adding more details about your product/service, target audience, and value proposition.';
    } else if (score <= 80) {
      quality = 'good';
      feedback = 'Your pitch has potential but could be enhanced with more specific details and stronger value propositions.';
    } else {
      quality = 'excellent';
      feedback = 'Your pitch appears well-structured and ready for detailed analysis.';
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: quality !== 'invalid',
      quality,
      score,
      feedback,
      issues
    };
  }

  /**
   * Get appropriate analysis score based on content quality
   */
  static getAnalysisScore(content: string): number {
    const validation = this.validatePitchQuality(content);
    
    if (!validation.isValid) {
      return 0; // Invalid content gets 0 score
    }
    
    // For poor quality content, return a very low score
    if (validation.quality === 'poor') {
      return Math.floor(Math.random() * 10) + 5; // 5-15 range
    }
    
    // For good quality content, return a moderate score
    if (validation.quality === 'good') {
      return Math.floor(Math.random() * 20) + 40; // 40-60 range
    }
    
    // For excellent content, return a high score (original mock logic)
    return Math.floor(Math.random() * 30) + 70; // 70-100 range
  }
}
