export interface Database {
  public: {
    Tables: {
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
      // TODO: Add assignments table when implementing grading functionality
      // assignments: { ... }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      // TODO: Add assignment_status enum when implementing grading functionality
      // assignment_status: 'pending' | 'processing' | 'completed' | 'error'
    }
  }
}