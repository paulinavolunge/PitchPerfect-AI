
/**
 * Utility functions for webhook integrations
 */

interface SessionData {
  [key: string]: any;
}

/**
 * Sends session data to a Zapier webhook for CRM integration
 * @param sessionData - The completed session data
 * @returns Promise resolving to the webhook response
 */
export const sendSessionToCRM = async (sessionData: SessionData): Promise<{ success: boolean; message: string }> => {
  try {
    // In a production environment, this would be retrieved from environment variables
    // For now, we're checking if it exists in window.ENV (which would be injected at build time)
    const webhookUrl = (window as any)?.ENV?.ZAPIER_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn("ZAPIER_WEBHOOK_URL not configured");
      return { 
        success: false, 
        message: "Zapier webhook URL not configured" 
      };
    }
    
    // Add metadata to the payload
    const payload = {
      ...sessionData,
      timestamp: new Date().toISOString(),
      source: "PitchPerfect AI",
      isPriority: sessionData.requestType === "pdf_recap" // Mark PDF recaps as priority
    };
    
    console.log("Sending session to CRM via Zapier webhook:", payload);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      console.log("✅ CRM webhook success");
      return { 
        success: true, 
        message: "Successfully pushed to CRM" 
      };
    } else {
      console.error("❌ CRM webhook failed:", response.statusText);
      return { 
        success: false, 
        message: `Webhook failed: ${response.statusText}` 
      };
    }
  } catch (error) {
    console.error("❌ CRM webhook error:", error);
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Send immediate email confirmation before the full PDF is ready
 * @param email - The user's email address
 * @returns Promise resolving to the webhook response
 */
export const sendImmediateConfirmation = async (email: string): Promise<{ success: boolean }> => {
  // This would be implemented with a separate webhook or email service
  // For now we're just logging it
  console.log("Would send immediate confirmation to:", email);
  return { success: true };
};
