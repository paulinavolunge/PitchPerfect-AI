/**
 * Utilities for handling encryption and decryption of sensitive data
 * This provides an additional layer of encryption beyond Supabase's built-in encryption at rest
 */

// AES encryption for sensitive content using the Web Crypto API
export async function encryptData(data: string): Promise<string> {
  try {
    // Convert the data to an ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a random encryption key (we'll use AES-GCM)
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
    
    // Generate a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      dataBuffer
    );
    
    // Export the key so we can store it
    const exportedKey = await window.crypto.subtle.exportKey("jwk", key);
    
    // Combine the IV, key, and encrypted data into a single object
    const encryptedObject = {
      iv: Array.from(iv),
      encryptedData: Array.from(new Uint8Array(encryptedBuffer)),
      key: exportedKey,
    };
    
    // Convert to a string for storage
    return JSON.stringify(encryptedObject);
  } catch (error) {
    console.error("Encryption failed:", error);
    // Fallback to original data if encryption fails
    return data;
  }
}

export async function decryptData(encryptedString: string): Promise<string> {
  try {
    // Parse the encrypted string back into an object
    const encryptedObject = JSON.parse(encryptedString);
    
    // Convert arrays back to Uint8Arrays/ArrayBuffers
    const iv = new Uint8Array(encryptedObject.iv);
    const encryptedData = new Uint8Array(encryptedObject.encryptedData);
    
    // Import the key
    const key = await window.crypto.subtle.importKey(
      "jwk",
      encryptedObject.key,
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // not extractable
      ["decrypt"]
    );
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encryptedData
    );
    
    // Convert the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    // Return placeholder text to indicate failure
    throw new Error("Unable to decrypt data");
  }
}

/**
 * Check if a string is likely to be encrypted data from our encryptData function
 */
export function isEncryptedData(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return (
      Array.isArray(parsed.iv) &&
      Array.isArray(parsed.encryptedData) &&
      parsed.key !== undefined
    );
  } catch {
    return false;
  }
}

// Helper function to safely encrypt/decrypt data
export async function processDataSecurely<T>(
  action: "encrypt" | "decrypt",
  data: T,
  sensitiveFields: string[] = []
): Promise<T> {
  // If data is not an object or there are no sensitive fields, return it as-is
  if (typeof data !== "object" || !data || sensitiveFields.length === 0) {
    return data;
  }
  
  // Create a copy of the data
  const result = { ...data } as any;
  
  // Process each sensitive field
  for (const field of sensitiveFields) {
    if (result[field]) {
      if (action === "encrypt" && typeof result[field] === "string" && !isEncryptedData(result[field])) {
        result[field] = await encryptData(result[field]);
      } else if (action === "decrypt" && typeof result[field] === "string" && isEncryptedData(result[field])) {
        try {
          result[field] = await decryptData(result[field]);
        } catch (err) {
          console.warn(`Failed to decrypt field: ${field}`, err);
          // Keep the encrypted data rather than losing it
        }
      }
    }
  }
  
  return result as T;
}
