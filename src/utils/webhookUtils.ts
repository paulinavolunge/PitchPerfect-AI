
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
export const sendImmediateConfirmation = async (email: string): Promise<{ success: boolean }> => {
  // This would be implemented with a separate webhook or email service
  // For now we're just logging it
  console.log("Would send immediate confirmation to:", email);
  return { success: true };
};
