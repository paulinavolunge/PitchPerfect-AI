
import DOMPurify from 'dompurify';

export const sanitizeUserInput = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'], 
    ALLOWED_ATTR: [],
    RETURN_TRUSTED_TYPE: false, // Fixed: return string instead of TrustedHTML
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  });
};

// Enhanced sanitization for rich text content
export const sanitizeRichText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    RETURN_TRUSTED_TYPE: false
  });
};

// Strict sanitization for sensitive data (removes all HTML)
export const sanitizeStrictly = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_TRUSTED_TYPE: false
  });
};
