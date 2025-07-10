
import { ServerSideValidationService } from '@/services/ServerSideValidationService';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationConfig {
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  enableServerSideValidation: boolean;
}

export const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  allowedMimeTypes: [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/webm',
    'audio/ogg',
    'audio/m4a',
    'audio/mp4',
    'audio/aac'
  ],
  maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
  enableServerSideValidation: true
};

export class FileValidator {
  private config: FileValidationConfig;

  constructor(config: FileValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    this.config = config;
  }

  async validateFile(file: File, userId?: string): Promise<FileValidationResult> {
    // Client-side validation first
    const clientValidation = this.validateFileClientSide(file);
    if (!clientValidation.isValid) {
      return clientValidation;
    }

    // Server-side validation if enabled
    if (this.config.enableServerSideValidation) {
      try {
        const serverValidation = await ServerSideValidationService.validateFileUpload(
          file.name,
          file.size,
          file.type,
          userId
        );

        return {
          isValid: serverValidation.valid,
          error: serverValidation.error
        };
      } catch (error) {
        console.error('Server-side validation failed:', error);
        // Fall back to client-side validation if server fails
        return clientValidation;
      }
    }

    return clientValidation;
  }

  private validateFileClientSide(file: File): FileValidationResult {
    // Check file type
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Please upload one of: ${this.config.allowedMimeTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > this.config.maxFileSizeBytes) {
      const maxSizeMB = this.config.maxFileSizeBytes / (1024 * 1024);
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    return { isValid: true };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
