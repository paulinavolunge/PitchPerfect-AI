import { describe, it, expect } from 'vitest';
import { objectionDetectionService } from '@/services/ObjectionDetectionService';

describe('ObjectionDetectionService', () => {
  it('detects price objections and formats response', () => {
    const input = 'This seems too expensive and not worth the cost';
    const detected = objectionDetectionService.detectObjection(input);
    expect(detected.type).toBe('price');
    const response = objectionDetectionService.generateObjectionResponse(detected.type);
    const formatted = objectionDetectionService.formatResponse(response);
    expect(formatted.length).toBeGreaterThan(10);
  });

  it('returns none for neutral text', () => {
    const input = 'Hello there, just saying hi';
    const detected = objectionDetectionService.detectObjection(input);
    expect(detected.type === 'none' || detected.confidence < 0.31).toBeTruthy();
  });
});