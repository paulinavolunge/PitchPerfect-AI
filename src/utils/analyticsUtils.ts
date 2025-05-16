
// Analytics utility for PitchPerfect AI
import { trackEvent } from './analytics';

/**
 * Track demo activation events
 * @param activationType How the demo was activated (auto, button, scroll)
 */
export const trackDemoActivation = (activationType: 'auto' | 'button' | 'scroll') => {
  try {
    console.log(`Demo activated via: ${activationType}`);
    
    // Track event using our analytics utility
    trackEvent('demo_activated', {
      'activation_type': activationType,
      'timestamp': new Date().toISOString()
    });
    
    // You could also store locally or send to your backend
    const demoActivations = JSON.parse(localStorage.getItem('demo_activations') || '[]');
    demoActivations.push({
      type: activationType,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('demo_activations', JSON.stringify(demoActivations));
  } catch (error) {
    console.error('Error tracking demo activation:', error);
  }
};

/**
 * Track voice response timing 
 * @param responseTimeMs Time in milliseconds for voice response
 */
export const trackVoiceResponseTime = (responseTimeMs: number) => {
  try {
    console.log(`Voice response time: ${responseTimeMs}ms`);
    
    // Alert if response time exceeds SLA
    if (responseTimeMs > 3000) {
      console.warn(`Voice response time exceeded SLA: ${responseTimeMs}ms`);
      // In production, this would trigger an alert system
    }
    
    // Track event using our analytics utility
    trackEvent('voice_response_time', {
      'time_ms': responseTimeMs,
      'exceeded_sla': responseTimeMs > 3000
    });
  } catch (error) {
    console.error('Error tracking voice response time:', error);
  }
};

/**
 * Track transcription confidence
 * @param confidence Confidence score between 0 and 1
 * @returns Whether the confidence is below threshold
 */
export const checkTranscriptionConfidence = (confidence: number): boolean => {
  // Track the confidence score
  try {
    console.log(`Transcription confidence: ${confidence}`);
    
    trackEvent('transcription_confidence', {
      'confidence': confidence,
      'below_threshold': confidence < 0.6
    });
  } catch (error) {
    console.error('Error tracking transcription confidence:', error);
  }
  
  // Return whether confidence is below threshold
  return confidence < 0.6;
};
