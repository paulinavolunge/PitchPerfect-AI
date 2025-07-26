/**
 * HTML sanitization utilities for safe dynamic content
 */
import { secureLog } from './secureLog';

/**
 * Validates and sanitizes CSS strings for style injection
 * Only allows safe CSS properties and values
 */
export const sanitizeCSSString = (css: string): string => {
  // Remove potentially dangerous CSS
  let sanitized = css
    // Remove JavaScript URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data URLs
    .replace(/data\s*:/gi, '')
    // Remove expression() calls (IE specific)
    .replace(/expression\s*\(/gi, '')
    // Remove import statements
    .replace(/@import/gi, '')
    // Remove behavior property (IE specific)
    .replace(/behavior\s*:/gi, '')
    // Remove -moz-binding (Firefox specific)
    .replace(/-moz-binding/gi, '');

  // Validate that it only contains safe CSS characters
  const safeCSSPattern = /^[a-zA-Z0-9\s\-_:;,.%#(){}[\]"'\/\n\r\t]*$/;
  
  if (!safeCSSPattern.test(sanitized)) {
    throw new Error('CSS contains potentially unsafe characters');
  }

  return sanitized;
};

/**
 * Validates CSS keyframe animations for confetti effect
 * Specifically designed for the ConfettiEffect component
 */
export const validateConfettiKeyframes = (keyframes: string, particleId: number): string => {
  // Ensure the keyframes only contain expected particle ID
  const expectedPatterns = [
    `confetti-fall-x-${particleId}`,
    `confetti-fall-y-${particleId}`,
    `confetti-rotate-${particleId}`
  ];

  // Check that keyframes only contain expected animation names
  const hasValidAnimationNames = expectedPatterns.every(pattern => 
    keyframes.includes(pattern)
  );

  if (!hasValidAnimationNames) {
    throw new Error(`Invalid keyframe animation names for particle ${particleId}`);
  }

  // Additional CSS sanitization
  return sanitizeCSSString(keyframes);
};

/**
 * Validates chart CSS for the Chart component
 * Ensures only color CSS variables are being set
 */
export const validateChartCSS = (css: string, chartId: string): string => {
  // Ensure CSS only contains expected chart data attribute
  if (!css.includes(`[data-chart=${chartId}]`)) {
    throw new Error(`CSS does not contain expected chart ID: ${chartId}`);
  }

  // Ensure CSS only sets color variables
  const colorVariablePattern = /--color-[a-zA-Z0-9\-_]+\s*:\s*[a-zA-Z0-9\s#(),.-]+;/g;
  const lines = css.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, selectors, and braces
    if (!trimmed || trimmed.includes('[data-chart') || trimmed === '{' || trimmed === '}') {
      continue;
    }
    
    if (!colorVariablePattern.test(trimmed)) {
      throw new Error(`CSS line contains invalid content: ${trimmed}`);
    }
  }

  return sanitizeCSSString(css);
};

/**
 * Safe alternative to dangerouslySetInnerHTML for trusted CSS
 * Provides additional validation layer
 */
export const createSafeStyleProps = (css: string, validator?: (css: string) => string) => {
  try {
    const sanitizedCSS = validator ? validator(css) : sanitizeCSSString(css);
    return { __html: sanitizedCSS };
  } catch (error) {
    secureLog.error('CSS validation failed:', error);
    // Return empty style object as fallback
    return { __html: '' };
  }
};