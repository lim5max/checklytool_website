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
          title?: string
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string
          variant_count?: number
        }
        Relationships: []
      }
      essay_grading_criteria: {
        Row: {
          check_id: string | null
          created_at: string | null
          description: string
          grade: number
          id: string
          max_errors: number | null
          min_errors: number | null
          title: string
        }
        Insert: {
          check_id?: string | null
          created_at?: string | null
          description: string
          grade: number
          id?: string
          max_errors?: number | null
          min_errors?: number | null
          title: string
        }
        Update: {
          check_id?: string | null
          created_at?: string | null
          description?: string
          grade?: number
          id?: string
          max_errors?: number | null
          min_errors?: number | null
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
          ai_response: Json | null
          confidence_score: number | null
          correct_answers: number
          created_at: string | null
          detailed_answers: Json | null
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
          ai_response?: Json | null
          confidence_score?: number | null
          correct_answers: number
          created_at?: string | null
          detailed_answers?: Json | null
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
          ai_response?: Json | null
          confidence_score?: number | null
          correct_answers?: number
          created_at?: string | null
          detailed_answers?: Json | null
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_login_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          provider: string | null
          role: string | null
          total_checks: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_login_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          provider?: string | null
          role?: string | null
          total_checks?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_login_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          provider?: string | null
          role?: string | null
          total_checks?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      add_check_variant: {
        Args: { check_uuid: string; variant_name?: string }
        Returns: string
      }
      get_check_variants_with_answers: {
        Args: { check_uuid: string }
        Returns: {
          answers: Json
          variant_id: string
          variant_name: string
          variant_number: number
        }[]
      }
      remove_check_variant: {
        Args: { variant_uuid: string }
        Returns: boolean
      }
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