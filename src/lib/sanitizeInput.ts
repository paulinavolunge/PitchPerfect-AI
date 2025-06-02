
import DOMPurify from 'dompurify';

export const sanitizeUserInput = (dirty: string) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], 
    RETURN_TRUSTED_TYPE: true
  });
};
