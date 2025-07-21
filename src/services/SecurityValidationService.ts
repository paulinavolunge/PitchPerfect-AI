import { supabase } from '@/integrations/supabase/client';
import { EnhancedContentSafetyService } from './EnhancedContentSafetyService';
import { EnhancedRateLimitService } from './EnhancedRateLimitService';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
  was_sanitized?: boolean;
}

export class SecurityValidationService {
  /**
   * Validates user input comprehensively
   */
  static async validateUserInput(
    input: string,
    userId: string,
    inputType: 'voice' | 'text' | 'file_name' = 'text'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedData: string = input;

    try {
      // Basic validation
      if (!input || typeof input !== 'string') {
        errors.push('Input must be a non-empty string');
        return { valid: false, errors, warnings };
      }

      // Length validation
      const maxLength = inputType === 'voice' ? 5000 : 10000;
      if (input.length > maxLength) {
        errors.push(`Input too long (max ${maxLength} characters)`);
        return { valid: false, errors, warnings };
      }

      // Rate limiting check
      const rateLimitAction = inputType === 'voice' ? 'voice_processing' : 'content_generation';
      const rateLimitResult = await EnhancedRateLimitService.checkRateLimit(userId, rateLimitAction);
      
      if (!rateLimitResult.allowed) {
        errors.push(`Rate limit exceeded. Try again later.`);
        return { valid: false, errors, warnings };
      }

      // Content safety validation
      const safetyResult = inputType === 'voice' 
        ? await EnhancedContentSafetyService.validateVoiceInput(input, userId)
        : await EnhancedContentSafetyService.validateContent(input, userId);

      if (!safetyResult.safe) {
        errors.push(safetyResult.error || 'Content failed safety validation');
        return { valid: false, errors, warnings };
      }

      if (safetyResult.was_sanitized) {
        warnings.push('Content was automatically sanitized for safety');
        sanitizedData = safetyResult.sanitized_content || input;
      }

      if (safetyResult.safety_score < 80) {
        warnings.push('Content has moderate safety concerns');
      }

      return {
        valid: true,
        errors,
        warnings,
        sanitizedData,
        was_sanitized: safetyResult.was_sanitized
      };

    } catch (error) {
      console.error('Security validation error:', error);
      errors.push('Validation service temporarily unavailable');
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validates file upload parameters
   */
  static async validateFileUpload(
    fileName: string,
    fileSize: number,
    fileType: string,
    userId: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Rate limiting for file uploads
      const rateLimitResult = await EnhancedRateLimitService.checkRateLimit(userId, 'file_upload');
      
      if (!rateLimitResult.allowed) {
        errors.push('File upload rate limit exceeded. Try again later.');
        return { valid: false, errors, warnings };
      }

      // Use the secure file validation function
      const { data, error } = await supabase.rpc('secure_validate_file_upload', {
        p_file_name: fileName,
        p_file_size: fileSize,
        p_file_type: fileType,
        p_user_id: userId
      });

      if (error) {
        console.error('File validation error:', error);
        errors.push('File validation failed');
        return { valid: false, errors, warnings };
      }

      const validationResult = data as unknown as { valid: boolean; error?: string; sanitized_name?: string };
      if (!validationResult.valid) {
        errors.push(validationResult.error || 'File validation failed');
        return { valid: false, errors, warnings };
      }

      // Additional client-side validation
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      
      if (suspiciousExtensions.includes(fileExtension)) {
        errors.push('File type not allowed for security reasons');
        return { valid: false, errors, warnings };
      }

      // File size warnings
      const sizeMB = fileSize / (1024 * 1024);
      if (sizeMB > 20) {
        warnings.push('Large file size may result in slower processing');
      }

      return {
        valid: true,
        errors,
        warnings,
        sanitizedData: {
          sanitized_name: validationResult.sanitized_name,
          original_name: fileName
        }
      };

    } catch (error) {
      console.error('File validation service error:', error);
      errors.push('File validation service temporarily unavailable');
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validates admin operations
   */
  static async validateAdminOperation(
    operation: string,
    userId: string,
    targetData?: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if user is verified admin
      const { data: isAdmin, error } = await supabase.rpc('is_verified_admin');

      if (error || !isAdmin) {
        errors.push('Insufficient privileges for this operation');
        return { valid: false, errors, warnings };
      }

      // Log admin operation for audit
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'admin_operation_attempt',
        event_details: {
          operation,
          target_data: targetData ? JSON.stringify(targetData).substring(0, 1000) : null,
          timestamp: new Date().toISOString()
        }
      });

      // Specific validation for dangerous operations
      if (operation === 'delete_user' || operation === 'revoke_admin') {
        warnings.push('This is a high-impact operation. Please ensure this is intentional.');
      }

      return {
        valid: true,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Admin validation error:', error);
      errors.push('Admin validation service temporarily unavailable');
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Comprehensive security health check
   */
  static async performSecurityHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check database security health
      const { data: dbHealth, error } = await supabase.rpc('security_health_check');
      
      const healthResult = dbHealth as unknown as { status: string };
      if (error || healthResult?.status !== 'healthy') {
        issues.push('Database security health check failed');
        recommendations.push('Review database security configuration');
      }

      // Check rate limiting functionality
      const rateLimitCheck = await EnhancedRateLimitService.checkRateLimit('test-user', 'api_call');
      if (!rateLimitCheck) {
        issues.push('Rate limiting service unavailable');
        recommendations.push('Verify rate limiting configuration');
      }

      // Check content safety service
      const safetyCheck = await EnhancedContentSafetyService.validateContent('test content');
      if (!safetyCheck || safetyCheck.error) {
        issues.push('Content safety service has issues');
        recommendations.push('Review content validation configuration');
      }

      const status = issues.length === 0 ? 'healthy' : 
                    issues.length <= 2 ? 'warning' : 'critical';

      return { status, issues, recommendations };

    } catch (error) {
      console.error('Security health check error:', error);
      return {
        status: 'critical',
        issues: ['Security health check failed completely'],
        recommendations: ['Immediate security review required']
      };
    }
  }
}