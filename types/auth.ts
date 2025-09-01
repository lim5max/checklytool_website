import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  id: string
  email?: string
  user_metadata: {
    full_name?: string
    first_name?: string
    last_name?: string
    display_name?: string
    avatar_url?: string
  }
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export interface ResetPasswordFormData {
  email: string
}

export interface UpdatePasswordFormData {
  password: string
  confirmPassword: string
}

export type AuthProvider = 'google' | 'yandex' | 'vk'

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  signIn: (data: LoginFormData) => Promise<void>
  signUp: (data: RegisterFormData) => Promise<void>
  signOut: () => Promise<void>
  signInWithProvider: (provider: AuthProvider) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  clearError: () => void
}