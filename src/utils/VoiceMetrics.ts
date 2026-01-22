
import { trackVoiceResponseTime } from './analyticsUtils';

/**
 * Utility class to track voice response metrics
 */
class VoiceMetrics {
  private static instance: VoiceMetrics;
  private responseStartTimes: Map<string, number> = new Map();
  
  private constructor() {}
  
  public static getInstance(): VoiceMetrics {
    if (!VoiceMetrics.instance) {
      VoiceMetrics.instance = new VoiceMetrics();
    }
    return VoiceMetrics.instance;
  }
  
  /**
   * Start timing a voice response
   * @param id Unique identifier for this response
   */
  public startTiming(id: string): void {
    this.responseStartTimes.set(id, performance.now());
  }
  
  /**
   * End timing a voice response and get the elapsed time
   * @param id Unique identifier matching the one used in startTiming
   * @returns Time elapsed in milliseconds
   */
  public endTiming(id: string): number {
    const startTime = this.responseStartTimes.get(id);
    if (startTime === undefined) {
      console.warn(`No start time found for voice response with id: ${id}`);
      return 0;
    }
    
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    
    // Remove from map to avoid memory leaks
    this.responseStartTimes.delete(id);
    
    // Track the response time for analytics
    trackVoiceResponseTime(elapsedTime);
    
    return elapsedTime;
  }
}

export default VoiceMetrics;
