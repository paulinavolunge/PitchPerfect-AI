
import { supabase } from '@/lib/supabase';
import { processDataSecurely } from '@/utils/encryptionUtils';

// Define which fields should be encrypted for different data types
const sensitiveFieldsMap: Record<string, string[]> = {
  'pitch_recordings': ['transcript', 'feedback', 'audio_content'],
  'user_performance': ['feedback_details', 'notes'],
  'sales_scripts': ['content', 'private_notes']
};

/**
 * Service for securely storing and retrieving sensitive user data
 */
export class SecureDataService {
  /**
   * Insert data with encryption for sensitive fields
   */
  static async insertSecure(table: string, data: any) {
    try {
      // Get the list of sensitive fields for this table
      const sensitiveFields = sensitiveFieldsMap[table] || [];
      
      // Encrypt sensitive fields
      const processedData = await processDataSecurely('encrypt', data, sensitiveFields);
      
      // Insert into Supabase
      const { data: result, error } = await supabase
        .from(table)
        .insert(processedData)
        .select();
        
      if (error) throw error;
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error in insertSecure for ${table}:`, error);
      return { data: null, error };
    }
  }
  
  /**
   * Update data with encryption for sensitive fields
   */
  static async updateSecure(table: string, id: string | number, data: any, idField: string = 'id') {
    try {
      // Get the list of sensitive fields for this table
      const sensitiveFields = sensitiveFieldsMap[table] || [];
      
      // Encrypt sensitive fields
      const processedData = await processDataSecurely('encrypt', data, sensitiveFields);
      
      // Update in Supabase
      const { data: result, error } = await supabase
        .from(table)
        .update(processedData)
        .eq(idField, id)
        .select();
        
      if (error) throw error;
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error in updateSecure for ${table}:`, error);
      return { data: null, error };
    }
  }
  
  /**
   * Fetch and decrypt sensitive data
   */
  static async getSecure(table: string, query?: any) {
    try {
      // Start with base query
      let dbQuery = supabase.from(table).select('*');
      
      // Apply additional query parameters if provided
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          dbQuery = dbQuery.eq(key, value);
        });
      }
      
      // Execute the query
      const { data, error } = await dbQuery;
      
      if (error) throw error;
      if (!data) return { data: null, error: null };
      
      // Get the list of sensitive fields for this table
      const sensitiveFields = sensitiveFieldsMap[table] || [];
      
      // Decrypt sensitive fields for each row
      const decryptedData = await Promise.all(
        data.map(async (row) => await processDataSecurely('decrypt', row, sensitiveFields))
      );
      
      return { data: decryptedData, error: null };
    } catch (error) {
      console.error(`Error in getSecure for ${table}:`, error);
      return { data: null, error };
    }
  }
  
  /**
   * Delete data securely
   */
  static async deleteSecure(table: string, id: string | number, idField: string = 'id') {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idField, id);
        
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error(`Error in deleteSecure for ${table}:`, error);
      return { success: false, error };
    }
  }
}
