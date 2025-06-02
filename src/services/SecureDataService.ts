
import { supabase } from '@/lib/supabase';
import { sanitizeStrictly } from '@/lib/sanitizeInput';

// Define which fields should be sanitized for different data types
const sensitiveFieldsMap: Record<string, string[]> = {
  'pitch_recordings': ['transcript', 'feedback', 'title'],
  'user_performance': ['feedback_details', 'notes'],
  'sales_scripts': ['content', 'private_notes', 'title']
};

/**
 * Service for securely storing and retrieving user data with proper sanitization
 */
export class SecureDataService {
  /**
   * Sanitize input data before database operations
   */
  private static sanitizeData(table: string, data: any): any {
    const sensitiveFields = sensitiveFieldsMap[table] || [];
    const sanitizedData = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitizedData[field] && typeof sanitizedData[field] === 'string') {
        sanitizedData[field] = sanitizeStrictly(sanitizedData[field]);
      }
    });
    
    return sanitizedData;
  }

  /**
   * Validate user ownership and authentication
   */
  private static async validateUserAccess(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }
    
    return user.id;
  }

  /**
   * Insert data with sanitization and user validation
   */
  static async insertSecure(table: string, data: any) {
    try {
      // Validate user authentication
      const userId = await this.validateUserAccess();
      
      // Ensure user_id is set correctly
      const sanitizedData = this.sanitizeData(table, {
        ...data,
        user_id: userId // Force correct user_id
      });
      
      // Insert into Supabase with RLS protection
      const { data: result, error } = await supabase
        .from(table)
        .insert(sanitizedData)
        .select();
        
      if (error) {
        console.error(`Database error in insertSecure for ${table}:`, error);
        throw error;
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error in insertSecure for ${table}:`, error);
      return { data: null, error };
    }
  }
  
  /**
   * Update data with sanitization and user validation
   */
  static async updateSecure(table: string, id: string | number, data: any, idField: string = 'id') {
    try {
      // Validate user authentication
      await this.validateUserAccess();
      
      // Sanitize the input data (don't override user_id in updates)
      const sanitizedData = this.sanitizeData(table, data);
      
      // Update in Supabase with RLS protection
      const { data: result, error } = await supabase
        .from(table)
        .update(sanitizedData)
        .eq(idField, id)
        .select();
        
      if (error) {
        console.error(`Database error in updateSecure for ${table}:`, error);
        throw error;
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error in updateSecure for ${table}:`, error);
      return { data: null, error };
    }
  }
  
  /**
   * Fetch data with user validation
   */
  static async getSecure(table: string, query?: any) {
    try {
      // Validate user authentication
      await this.validateUserAccess();
      
      // Start with base query - RLS will handle user filtering
      let dbQuery = supabase.from(table).select('*');
      
      // Apply additional query parameters if provided
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          dbQuery = dbQuery.eq(key, value);
        });
      }
      
      // Execute the query
      const { data, error } = await dbQuery;
      
      if (error) {
        console.error(`Database error in getSecure for ${table}:`, error);
        throw error;
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error(`Error in getSecure for ${table}:`, error);
      return { data: null, error };
    }
  }
  
  /**
   * Delete data securely with user validation
   */
  static async deleteSecure(table: string, id: string | number, idField: string = 'id') {
    try {
      // Validate user authentication
      await this.validateUserAccess();
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idField, id);
        
      if (error) {
        console.error(`Database error in deleteSecure for ${table}:`, error);
        throw error;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error(`Error in deleteSecure for ${table}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Secure credit deduction using the new database function
   */
  static async deductCreditsSecurely(featureUsed: string, creditsToDeduct: number) {
    try {
      const userId = await this.validateUserAccess();
      
      const { data, error } = await supabase.rpc('secure_deduct_credits_and_log_usage', {
        p_user_id: userId,
        p_feature_used: sanitizeStrictly(featureUsed),
        p_credits_to_deduct: creditsToDeduct
      });
      
      if (error) {
        console.error('Error in secure credit deduction:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to deduct credits securely:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
