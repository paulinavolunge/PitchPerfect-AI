
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
export const sanitizeStrictly = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // More aggressive sanitization for security contexts
  return input
    .replace(/[<>:"/\\|?*&%$#@!`~]/g, '_') // Remove more special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.-]/g, '_') // Keep only word characters, spaces, dots, and hyphens
    .trim()
    .slice(0, 500); // Longer limit for general content but still bounded
};
