export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auth_rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          email: string
          failed_attempts: number | null
          id: string
          ip_address: unknown
          last_attempt: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          email: string
          failed_attempts?: number | null
          id?: string
          ip_address: unknown
          last_attempt?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          email?: string
          failed_attempts?: number | null
          id?: string
          ip_address?: unknown
          last_attempt?: string | null
        }
        Relationships: []
      }
      data_access_logs: {
        Row: {
          accessed_at: string
          client_info: string | null
          id: string
          ip_address: unknown | null
          operation: string
          record_id: string | null
          success: boolean | null
          table_accessed: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          client_info?: string | null
          id?: string
          ip_address?: unknown | null
          operation: string
          record_id?: string | null
          success?: boolean | null
          table_accessed: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          client_info?: string | null
          id?: string
          ip_address?: unknown | null
          operation?: string
          record_id?: string | null
          success?: boolean | null
          table_accessed?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pitch_recordings: {
        Row: {
          audio_content: string | null
          audio_url: string | null
          created_at: string
          duration: number | null
          feedback: string | null
          id: string
          is_public: boolean | null
          score: number | null
          title: string | null
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_content?: string | null
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          feedback?: string | null
          id?: string
          is_public?: boolean | null
          score?: number | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_content?: string | null
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          feedback?: string | null
          id?: string
          is_public?: boolean | null
          score?: number | null
          title?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_change_log: {
        Row: {
          action: string
          changed_by: string
          id: string
          ip_address: unknown | null
          new_role: string
          old_role: string | null
          target_user_id: string
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_by: string
          id?: string
          ip_address?: unknown | null
          new_role: string
          old_role?: string | null
          target_user_id: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_by?: string
          id?: string
          ip_address?: unknown | null
          new_role?: string
          old_role?: string | null
          target_user_id?: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      sales_scripts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_public: boolean | null
          private_notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          private_notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean | null
          private_notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_summary: {
        Row: {
          created_at: string
          date: string
          event_count: number | null
          event_type: string
          id: string
          severity_level: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          event_count?: number | null
          event_type: string
          id?: string
          severity_level?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          event_count?: number | null
          event_type?: string
          id?: string
          severity_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_log: {
        Row: {
          credits_used: number
          feature_used: string
          id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          credits_used: number
          feature_used: string
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          credits_used?: number
          feature_used?: string
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_performance: {
        Row: {
          created_at: string
          feedback_details: string | null
          id: string
          metrics: Json | null
          notes: string | null
          score: number | null
          session_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_details?: string | null
          id?: string
          metrics?: Json | null
          notes?: string | null
          score?: number | null
          session_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_details?: string | null
          id?: string
          metrics?: Json | null
          notes?: string | null
          score?: number | null
          session_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          credits_remaining: number
          id: string
          trial_used: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number
          id: string
          trial_used?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          trial_used?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: unknown
          request_count: number | null
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          request_count?: number | null
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_permission: {
        Args: { p_user_id: string; p_required_role?: string }
        Returns: boolean
      }
      cleanup_expired_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      deduct_credits_and_log_usage: {
        Args: {
          p_user_id: string
          p_feature_used: string
          p_credits_to_deduct: number
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_verified_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_event_details?: Json
          p_user_id?: string
        }
        Returns: undefined
      }
      secure_deduct_credits_and_log_usage: {
        Args: { p_user_id: string; p_feature_used: string }
        Returns: Json
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_file_upload: {
        Args: {
          p_file_name: string
          p_file_size: number
          p_file_type: string
          p_user_id?: string
        }
        Returns: Json
      }
      validate_voice_input: {
        Args: { p_input: string; p_user_id?: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
