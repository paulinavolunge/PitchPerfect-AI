
/**
 * Utility functions for webhook integrations
 */

interface SessionData {
  [key: string]: any;
}

export type CRMProvider = "zapier" | "hubspot" | "salesforce" | "freshsales" | "custom";

/**
 * Get the stored webhook URL from localStorage if available
 * @param provider - The CRM provider
 * @returns The stored webhook URL or undefined
 */
export const getStoredWebhookUrl = (provider: CRMProvider = "zapier"): string | undefined => {
  const storedUrls = localStorage.getItem('crm_webhook_urls');
  if (storedUrls) {
    try {
      const urls = JSON.parse(storedUrls);
      return urls[provider];
    } catch (e) {
      console.error("Error parsing stored webhook URLs:", e);
      return undefined;
    }
  }
  return undefined;
};

/**
 * Save a webhook URL to localStorage
 * @param provider - The CRM provider
 * @param url - The webhook URL to save
 */
export const saveWebhookUrl = (provider: CRMProvider, url: string): void => {
  try {
    const storedUrls = localStorage.getItem('crm_webhook_urls');
    const urls = storedUrls ? JSON.parse(storedUrls) : {};
    urls[provider] = url;
    localStorage.setItem('crm_webhook_urls', JSON.stringify(urls));
  } catch (e) {
    console.error("Error saving webhook URL:", e);
  }
};

/**
 * Get the webhook URL for the specified provider
 * @param provider - The CRM provider
 * @returns The webhook URL or undefined
 */
export const getWebhookUrl = (provider: CRMProvider = "zapier"): string | undefined => {
  // First check for environment variable (set at build time)
  const envUrl = (window as any)?.ENV?.[`${provider.toUpperCase()}_WEBHOOK_URL`];
  if (envUrl) {
    return envUrl;
  }
  
  // Fall back to localStorage
  return getStoredWebhookUrl(provider);
};

/**
 * Sends session data to a CRM webhook
 * @param sessionData - The completed session data
 * @param provider - The CRM provider to use
 * @returns Promise resolving to the webhook response
 */
export const sendSessionToCRM = async (
  sessionData: SessionData,
  provider: CRMProvider = "zapier"
): Promise<{ success: boolean; message: string }> => {
  try {
    const webhookUrl = getWebhookUrl(provider);
    
    if (!webhookUrl) {
      console.warn(`${provider} webhook URL not configured`);
      return { 
        success: false, 
        message: `${provider} webhook URL not configured` 
      };
    }
    
    // Add metadata to the payload
    const payload = {
      ...sessionData,
      timestamp: new Date().toISOString(),
      source: "PitchPerfect AI",
      crmProvider: provider,
      isPriority: sessionData.requestType === "pdf_recap" // Mark PDF recaps as priority
    };
    
    console.log(`Sending session to ${provider} via webhook:`, payload);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      console.log(`✅ ${provider} webhook success`);
      return { 
        success: true, 
        message: `Successfully pushed to ${provider}` 
      };
    } else {
      console.error(`❌ ${provider} webhook failed:`, response.statusText);
      return { 
        success: false, 
        message: `Webhook failed: ${response.statusText}` 
      };
    }
  } catch (error) {
    console.error(`❌ ${provider} webhook error:`, error);
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
export const sendImmediateConfirmation = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Get whatever webhook URL is configured for notifications
    const webhookUrl = getWebhookUrl("zapier") || getWebhookUrl("custom");
    
    if (!webhookUrl) {
      console.warn("No webhook URL configured for immediate notifications");
      return { 
        success: false, 
        message: "No webhook URL configured for immediate notifications" 
      };
    }
    
    // Create a transactional email payload
    const payload = {
      email,
      subject: "Your PitchPerfect AI Recap is Being Generated",
      messageType: "immediate_confirmation",
      timestamp: new Date().toISOString(),
      message: "Thank you for using PitchPerfect AI! Your pitch recap PDF is being generated and will be sent to you shortly.",
      priority: "high"
    };
    
    console.log("Sending immediate confirmation via webhook:", payload);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      mode: "no-cors" // Add this to handle CORS
    });
    
    // Since we're using no-cors, we won't get a proper response status
    return { 
      success: true, 
      message: "Confirmation email request sent" 
    };
  } catch (error) {
    console.error("Error sending immediate confirmation:", error);
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
