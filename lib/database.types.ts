export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      check_statistics: {
        Row: {
          average_score: number | null
          check_id: string | null
          completed_submissions: number | null
          grade_distribution: Json | null
          id: string
          last_updated: string | null
          total_submissions: number | null
        }
        Insert: {
          average_score?: number | null
          check_id?: string | null
          completed_submissions?: number | null
          grade_distribution?: Json | null
          id?: string
          last_updated?: string | null
          total_submissions?: number | null
        }
        Update: {
          average_score?: number | null
          check_id?: string | null
          completed_submissions?: number | null
          grade_distribution?: Json | null
          id?: string
          last_updated?: string | null
          total_submissions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_statistics_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: true
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
        ]
      }
      check_usage_history: {
        Row: {
          check_id: string | null
          check_type: string
          created_at: string | null
          credits_used: number
          id: string
          pages_count: number | null
          submission_id: string | null
          user_id: string
        }
        Insert: {
          check_id?: string | null
          check_type: string
          created_at?: string | null
          credits_used: number
          id?: string
          pages_count?: number | null
          submission_id?: string | null
          user_id: string
        }
        Update: {
          check_id?: string | null
          check_type?: string
          created_at?: string | null
          credits_used?: number
          id?: string
          pages_count?: number | null
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_usage_history_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_usage_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "student_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      check_variants: {
        Row: {
          check_id: string | null
          created_at: string | null
          id: string
          name: string
          reference_answers: Json | null
          reference_image_urls: string[] | null
          variant_number: number
        }
        Insert: {
          check_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          reference_answers?: Json | null
          reference_image_urls?: string[] | null
          variant_number: number
        }
        Update: {
          check_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          reference_answers?: Json | null
          reference_image_urls?: string[] | null
          variant_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "check_variants_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          check_type: string | null
          class_level: string | null
          created_at: string | null
          description: string | null
          id: string
          subject: string | null
          test_id: string | null
          title: string
          total_questions: number | null
          updated_at: string | null
          user_id: string
          variant_count: number
        }
        Insert: {
          check_type?: string | null
          class_level?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          subject?: string | null
          test_id?: string | null
          title: string
          total_questions?: number | null
          updated_at?: string | null
          user_id: string
          variant_count?: number
        }
        Update: {
          check_type?: string | null
          class_level?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          subject?: string | null
          test_id?: string | null
          title?: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string
          variant_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "checks_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "generated_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_grading_criteria: {
        Row: {
          check_id: string | null
          created_at: string | null
          description: string
          grade: number
          id: string
          title: string
        }
        Insert: {
          check_id?: string | null
          created_at?: string | null
          description: string
          grade: number
          id?: string
          title: string
        }
        Update: {
          check_id?: string | null
          created_at?: string | null
          description?: string
          grade?: number
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_grading_criteria_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_results: {
        Row: {
          additional_notes: string | null
          ai_response: Json | null
          confidence_score: number | null
          correct_answers: number
          created_at: string | null
          detailed_answers: Json | null
          essay_analysis: Json | null
          essay_metadata: Json | null
          final_grade: number
          id: string
          incorrect_answers: number
          percentage_score: number
          submission_id: string | null
          total_questions: number
          variant_used: number | null
        }
        Insert: {
          additional_notes?: string | null
          ai_response?: Json | null
          confidence_score?: number | null
          correct_answers: number
          created_at?: string | null
          detailed_answers?: Json | null
          essay_analysis?: Json | null
          essay_metadata?: Json | null
          final_grade: number
          id?: string
          incorrect_answers: number
          percentage_score: number
          submission_id?: string | null
          total_questions: number
          variant_used?: number | null
        }
        Update: {
          additional_notes?: string | null
          ai_response?: Json | null
          confidence_score?: number | null
          correct_answers?: number
          created_at?: string | null
          detailed_answers?: Json | null
          essay_analysis?: Json | null
          essay_metadata?: Json | null
          final_grade?: number
          id?: string
          incorrect_answers?: number
          percentage_score?: number
          submission_id?: string | null
          total_questions?: number
          variant_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_results_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "student_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_tests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          questions: Json
          subject: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          questions?: Json
          subject?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          questions?: Json
          subject?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      grading_criteria: {
        Row: {
          check_id: string | null
          created_at: string | null
          grade: number
          id: string
          min_percentage: number
        }
        Insert: {
          check_id?: string | null
          created_at?: string | null
          grade: number
          id?: string
          min_percentage: number
        }
        Update: {
          check_id?: string | null
          created_at?: string | null
          grade?: number
          id?: string
          min_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_criteria_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          is_recurrent: boolean | null
          order_id: string
          parent_payment_id: string | null
          payment_id: string | null
          payment_url: string | null
          plan_id: string | null
          rebill_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          is_recurrent?: boolean | null
          order_id: string
          parent_payment_id?: string | null
          payment_id?: string | null
          payment_url?: string | null
          plan_id?: string | null
          rebill_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          is_recurrent?: boolean | null
          order_id?: string
          parent_payment_id?: string | null
          payment_id?: string | null
          payment_url?: string | null
          plan_id?: string | null
          rebill_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student_submissions: {
        Row: {
          check_id: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          processing_completed_at: string | null
          processing_started_at: string | null
          status: string
          student_class: string | null
          student_name: string | null
          submission_images: string[]
          updated_at: string | null
          variant_detected: number | null
        }
        Insert: {
          check_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          status?: string
          student_class?: string | null
          student_name?: string | null
          submission_images: string[]
          updated_at?: string | null
          variant_detected?: number | null
        }
        Update: {
          check_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          processing_completed_at?: string | null
          processing_started_at?: string | null
          status?: string
          student_class?: string | null
          student_name?: string | null
          submission_images?: string[]
          updated_at?: string | null
          variant_detected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_submissions_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "checks"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_notifications: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          subscription_expires_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          subscription_expires_at: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          subscription_expires_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          check_credits: number
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          check_credits?: number
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          check_credits?: number
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          check_balance: number | null
          created_at: string | null
          customer_key: string | null
          email: string
          first_login_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          password_hash: string | null
          payment_failed_at: string | null
          payment_retry_count: number | null
          provider: string | null
          rebill_id: string | null
          role: string | null
          subscription_auto_renew: boolean | null
          subscription_expires_at: string | null
          subscription_plan_id: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          total_checks: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          check_balance?: number | null
          created_at?: string | null
          customer_key?: string | null
          email: string
          first_login_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          password_hash?: string | null
          payment_failed_at?: string | null
          payment_retry_count?: number | null
          provider?: string | null
          rebill_id?: string | null
          role?: string | null
          subscription_auto_renew?: boolean | null
          subscription_expires_at?: string | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          total_checks?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          check_balance?: number | null
          created_at?: string | null
          customer_key?: string | null
          email?: string
          first_login_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          password_hash?: string | null
          payment_failed_at?: string | null
          payment_retry_count?: number | null
          provider?: string | null
          rebill_id?: string | null
          role?: string | null
          subscription_auto_renew?: boolean | null
          subscription_expires_at?: string | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          total_checks?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_answers: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          question_number: number
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          question_number: number
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          question_number?: number
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_answers_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "check_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_check_variant:
        | {
            Args: { check_uuid: string; variant_name?: string }
            Returns: string
          }
        | {
            Args: { p_check_id: string; p_variant_number: number }
            Returns: string
          }
      add_subscription:
        | { Args: { p_plan_name: string; p_user_id: string }; Returns: Json }
        | {
            Args: {
              p_duration_days: number
              p_plan_id: string
              p_user_id: string
            }
            Returns: undefined
          }
      auto_expire_subscriptions: { Args: never; Returns: undefined }
      charge_subscription: {
        Args: { p_api_key: string; p_api_url: string; p_user_id: string }
        Returns: boolean
      }
      deduct_check_credits:
        | {
            Args: {
              p_check_id: string
              p_check_type: string
              p_pages_count: number
              p_submission_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: { p_credits_to_deduct: number; p_user_id: string }
            Returns: boolean
          }
      get_check_variants_with_answers: {
        Args: { p_check_id: string }
        Returns: Json
      }
      get_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      remove_check_variant: { Args: { p_variant_id: string }; Returns: boolean }
      set_config: {
        Args: { parameter: string; value: string }
        Returns: string
      }
      update_check_statistics: {
        Args: { check_uuid: string }
        Returns: undefined
      }
      update_user_profile_stats: {
        Args: { user_identifier: string }
        Returns: undefined
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
