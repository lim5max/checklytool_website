export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
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
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          name: string | null
          avatar_url: string | null
          provider: string | null
          role: string | null
          first_login_at: string | null
          last_login_at: string | null
          total_checks: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          provider?: string | null
          role?: string | null
          first_login_at?: string | null
          last_login_at?: string | null
          total_checks?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          provider?: string | null
          role?: string | null
          last_login_at?: string | null
          total_checks?: number | null
          is_active?: boolean | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      checks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          variant_count: number
          subject: string | null
          class_level: string | null
          total_questions: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          variant_count?: number
          subject?: string | null
          class_level?: string | null
          total_questions?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          variant_count?: number
          subject?: string | null
          class_level?: string | null
          total_questions?: number | null
          updated_at?: string
        }
      }
      grading_criteria: {
        Row: {
          id: string
          check_id: string
          grade: number
          min_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          check_id: string
          grade: number
          min_percentage: number
          created_at?: string
        }
        Update: {
          id?: string
          check_id?: string
          grade?: number
          min_percentage?: number
        }
      }
      check_variants: {
        Row: {
          id: string
          check_id: string
          variant_number: number
          reference_answers: Record<string, string> | null
          reference_image_urls: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          check_id: string
          variant_number: number
          reference_answers?: Record<string, string> | null
          reference_image_urls?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          check_id?: string
          variant_number?: number
          reference_answers?: Record<string, string> | null
          reference_image_urls?: string[] | null
        }
      }
      student_submissions: {
        Row: {
          id: string
          check_id: string
          student_name: string | null
          student_class: string | null
          submission_images: string[]
          status: string
          variant_detected: number | null
          processing_started_at: string | null
          processing_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          check_id: string
          student_name?: string | null
          student_class?: string | null
          submission_images: string[]
          status?: string
          variant_detected?: number | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          check_id?: string
          student_name?: string | null
          student_class?: string | null
          submission_images?: string[]
          status?: string
          variant_detected?: number | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          updated_at?: string
        }
      }
      evaluation_results: {
        Row: {
          id: string
          submission_id: string
          total_questions: number
          correct_answers: number
          incorrect_answers: number
          percentage_score: number
          final_grade: number
          variant_used: number | null
          detailed_answers: Record<string, { given: string; correct: string }> | null
          ai_response: Record<string, unknown> | null
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          total_questions: number
          correct_answers: number
          incorrect_answers: number
          percentage_score: number
          final_grade: number
          variant_used?: number | null
          detailed_answers?: Record<string, { given: string; correct: string }> | null
          ai_response?: Record<string, unknown> | null
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          total_questions?: number
          correct_answers?: number
          incorrect_answers?: number
          percentage_score?: number
          final_grade?: number
          variant_used?: number | null
          detailed_answers?: Record<string, { given: string; correct: string }> | null
          ai_response?: Record<string, unknown> | null
          confidence_score?: number | null
        }
      }
      check_statistics: {
        Row: {
          id: string
          check_id: string
          total_submissions: number
          completed_submissions: number
          average_score: number | null
          grade_distribution: Record<string, number> | null
          last_updated: string
        }
        Insert: {
          id?: string
          check_id: string
          total_submissions?: number
          completed_submissions?: number
          average_score?: number | null
          grade_distribution?: Record<string, number> | null
          last_updated?: string
        }
        Update: {
          id?: string
          check_id?: string
          total_submissions?: number
          completed_submissions?: number
          average_score?: number | null
          grade_distribution?: Record<string, number> | null
          last_updated?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      submission_status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry_needed'
      grade_value: 2 | 3 | 4 | 5
    }
  }
}
