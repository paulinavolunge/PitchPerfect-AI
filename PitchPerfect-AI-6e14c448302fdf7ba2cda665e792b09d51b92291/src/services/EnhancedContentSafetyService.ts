import { supabase } from '@/integrations/supabase/client';

export interface ContentSafetyResult {
  safe: boolean;
  sanitized_content?: string;
  safety_score: number;
  violations_found: number;
  was_sanitized: boolean;
  error?: string;
}

export class EnhancedContentSafetyService {
  private static readonly CLIENT_PATTERNS = [
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    
    // Injection patterns
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    
    // Social engineering patterns
    /click\s+here\s+to\s+claim/gi,
    /urgent\s+action\s+required/gi,
    /verify\s+your\s+account/gi,
  ];

  /**
   * Validates content safety using both client-side and server-side checks
   */
  static async validateContent(content: string, userId?: string): Promise<ContentSafetyResult> {
    try {
      // Client-side pre-validation
      const clientResult = this.clientSideValidation(content);
      if (!clientResult.safe) {
        return clientResult;
      }

      // Server-side validation using database function
      const { data, error } = await supabase.rpc('validate_content_safety', {
        p_content: content,
        p_user_id: userId || null
      });

      if (error) {
        console.error('Content safety validation failed:', error);
        // Fallback to client-side validation
        return clientResult;
      }

      return data as unknown as ContentSafetyResult;
    } catch (error) {
      console.error('Content safety service error:', error);
      
      // Fallback to strict client-side validation
      return {
        safe: false,
        safety_score: 0,
        violations_found: 1,
        was_sanitized: false,
        error: 'Content validation service unavailable'
      };
    }
  }

  /**
   * Client-side validation for immediate feedback
   */
  private static clientSideValidation(content: string): ContentSafetyResult {
    if (!content || content.trim().length === 0) {
      return {
        safe: false,
        safety_score: 0,
        violations_found: 0,
        was_sanitized: false,
        error: 'Content cannot be empty'
      };
    }

    if (content.length > 10000) {
      return {
        safe: false,
        safety_score: 0,
        violations_found: 0,
        was_sanitized: false,
        error: 'Content too long (max 10000 characters)'
      };
    }

    let safetyScore = 100;
    let violationsFound = 0;
    let sanitizedContent = content;

    // Check for malicious patterns
    for (const pattern of this.CLIENT_PATTERNS) {
      if (pattern.test(content)) {
        violationsFound++;
        safetyScore -= 20;
        sanitizedContent = sanitizedContent.replace(pattern, '');
      }
    }

    // Additional sanitization
    sanitizedContent = sanitizedContent.replace(/<[^>]*>/g, '').trim();

    return {
      safe: safetyScore >= 60,
      sanitized_content: sanitizedContent,
      safety_score: safetyScore,
      violations_found: violationsFound,
      was_sanitized: content !== sanitizedContent
    };
  }

  /**
   * Sanitizes content for safe display
   */
  static sanitizeForDisplay(content: string): string {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Validates voice input with additional audio-specific checks
   */
  static async validateVoiceInput(content: string, userId?: string): Promise<ContentSafetyResult> {
    // Additional patterns for voice-specific threats
    const voicePatterns = [
      /system\s+command/gi,
      /execute\s+code/gi,
      /run\s+script/gi,
      /access\s+files/gi,
    ];

    let result = await this.validateContent(content, userId);

    // Additional voice-specific validation
    if (result.safe) {
      for (const pattern of voicePatterns) {
        if (pattern.test(content)) {
          result.safe = false;
          result.safety_score -= 30;
          result.violations_found++;
          break;
        }
      }
    }

    return result;
  }
}