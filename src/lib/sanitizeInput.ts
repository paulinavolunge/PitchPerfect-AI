
export const sanitizeUserInput = (dirty: string): string => {
  // Remove potentially dangerous characters and normalize
  return dirty
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 255); // Limit length
};

// Enhanced sanitization for filenames
export const sanitizeFilename = (filename: string): string => {
  const sanitized = sanitizeUserInput(filename);
  
  // Ensure filename has valid extension
  if (!sanitized.includes('.')) {
    return sanitized + '.txt';
  }
  
  return sanitized;
};

// Sanitization for audio content
export const sanitizeAudioMetadata = (metadata: string): string => {
  return sanitizeUserInput(metadata);
};

// Strict sanitization for security-sensitive contexts
// Targets XSS vectors while preserving normal speech punctuation
export const sanitizeStrictly = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '')               // Strip HTML tags
    .replace(/javascript\s*:/gi, '')       // Strip javascript: protocol
    .replace(/on\w+\s*=/gi, '')            // Strip event handlers (onclick=, onerror=, etc.)
    .replace(/\s+/g, ' ')                  // Normalize whitespace
    .trim()
    .slice(0, 500);
};
