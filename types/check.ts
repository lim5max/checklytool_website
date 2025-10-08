// Database types for ChecklyTool main functionality

// User Profile types (for admin management)
export interface UserProfile {
  id: string
  user_id: string
  email: string
  name?: string
  avatar_url?: string
  provider?: 'google' | 'yandex'
  role: 'user' | 'admin'
  first_login_at: string
  last_login_at: string
  total_checks: number
  is_active: boolean
  created_at: string
  updated_at: string
  subscription_plan_id?: string | null
  check_balance: number
  subscription_started_at?: string | null
  subscription_expires_at?: string | null
}

export interface Check {
  id: string
  user_id: string
  title: string
  description?: string
  variant_count: number
  subject?: string
  class_level?: string
  total_questions?: number
  check_type: 'test' | 'essay'
  created_at: string
  updated_at: string
}

export interface GradingCriteria {
  id: string
  check_id: string
  grade: 2 | 3 | 4 | 5
  min_percentage: number
  created_at: string
}

export interface EssayGradingCriteria {
  id: string
  check_id: string | null
  grade: 2 | 3 | 4 | 5
  title: string
  description: string
  min_errors?: number
  max_errors?: number
  created_at: string
}

export interface CheckVariant {
  id: string
  check_id: string
  variant_number: number
  reference_answers?: Record<string, string> // {1: "A", 2: "B", ...}
  reference_image_urls?: string[]
  created_at: string
}

export interface StudentSubmission {
  id: string
  check_id: string
  student_name?: string
  student_class?: string
  submission_images: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry_needed'
  variant_detected?: number
  processing_started_at?: string
  processing_completed_at?: string
  error_message?: string
  error_details?: {
    error_type?: 'inappropriate_content' | 'unsupported_test_format' | 'ai_failure' | 'image_processing' | 'validation_error'
    content_type_detected?: string
    ai_message?: string
    [key: string]: string | number | boolean | null | undefined
  }
  created_at: string
  updated_at: string
}

export interface EvaluationResult {
  id: string
  submission_id: string
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  percentage_score: number
  final_grade: 2 | 3 | 4 | 5
  variant_used?: number
  detailed_answers?: Record<string, {
    given: string
    correct: string
    is_correct: boolean
  }>
  ai_response?: OpenRouterResponse // Full OpenRouter response
  confidence_score?: number
  essay_metadata?: {
    structure: {
      has_introduction: boolean
      has_body: boolean
      has_conclusion: boolean
      score: number
    }
    logic: {
      coherent: boolean
      clear_arguments: boolean
      score: number
    }
    errors: {
      grammar_errors: number
      syntax_errors: number
      total_errors: number
      examples: string[]
    }
    content_quality: string
    final_grade: number
  }
  created_at: string
}

export interface CheckStatistics {
  id: string
  check_id: string
  total_submissions: number
  completed_submissions: number
  average_score?: number
  grade_distribution?: Record<string, number> // {"2": 5, "3": 10, ...}
  last_updated: string
}

// Form types for creating/updating entities
export interface CreateCheckForm {
  title: string
  description?: string
  variant_count: number
  subject?: string
  class_level?: string
  total_questions?: number
  grading_criteria: Array<{
    grade: 2 | 3 | 4 | 5
    min_percentage: number
  }>
}

export interface CreateVariantForm {
  variant_number: number
  reference_answers?: Record<string, string>
  reference_images?: File[]
}

export interface SubmissionForm {
  student_name?: string
  student_class?: string
  images: File[]
}

// API response types
export interface CheckWithStats extends Check {
  statistics?: CheckStatistics
  variants: CheckVariant[]
  grading_criteria: GradingCriteria[]
}

export interface SubmissionWithResult extends StudentSubmission {
  evaluation_result?: EvaluationResult
}

export interface CheckDetailResponse {
  check: CheckWithStats
  recent_submissions: SubmissionWithResult[]
  submission_count: number
}

// OpenRouter API types
export interface OpenRouterRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string | Array<{
      type: 'text' | 'image_url'
      text?: string
      image_url?: {
        url: string
      }
    }>
  }>
  max_tokens?: number
  temperature?: number
  metadata?: {
    analysis_id?: string
    timestamp?: number
    [key: string]: unknown
  }
}

export interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// AI Analysis Response Structure - можеть быть либо успешный результат, либо ошибка контента
export interface AIAnalysisResponse {
  // Успешный анализ
  variant_detected?: number
  confidence_score?: number
  answers?: Record<string, {
    detected_answer: string
    confidence: number
  }>
  total_questions?: number
  student_name?: string
  additional_notes?: string

  // Дополнительные данные для ChecklyTool тестов
  checkly_tool_test?: boolean
  test_identifier?: string

  // Дополнительные данные для сочинений
  essay_analysis?: {
    structure: {
      has_introduction: boolean
      has_body: boolean
      has_conclusion: boolean
      score: number
    }
    logic: {
      coherent: boolean
      clear_arguments: boolean
      score: number
    }
    errors: {
      grammar_errors: number
      syntax_errors: number
      total_errors: number
      examples: string[]
    }
    content_quality: string
    final_grade: number
  }

  // Ошибки
  error?: 'inappropriate_content' | 'unsupported_test_format'
  error_message?: string
  content_type_detected?: string
}

// Admin Dashboard types
export interface AdminDashboardStats {
  total_users: number
  active_users: number
  total_checks: number
  total_submissions: number
  avg_submissions_per_check: number
  user_growth: Array<{
    date: string
    new_users: number
    total_users: number
  }>
  top_users: Array<{
    user_profile: UserProfile
    check_count: number
    submission_count: number
  }>
}

export interface UserManagement {
  users: UserProfile[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  filters: {
    role?: 'user' | 'admin'
    provider?: 'google' | 'yandex'
    is_active?: boolean
    search?: string
  }
}

// Dashboard types
export interface DashboardStats {
  total_checks: number
  total_submissions: number
  avg_completion_rate: number
  recent_activity: Array<{
    type: 'check_created' | 'submission_completed' | 'submission_failed'
    check_title: string
    timestamp: string
    details?: string
  }>
}

// Error types
export interface APIError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

export interface ProcessingError {
  submission_id: string
  error_type: 'ai_failure' | 'image_processing' | 'validation_error'
  error_message: string
  retry_count: number
  can_retry: boolean
}

// File upload types
export interface UploadedFile {
  url: string
  filename: string
  size: number
  upload_timestamp: string
}

export interface ImageUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

// Test Constructor types
export interface TestQuestion {
  id: string
  question: string
  type: 'single' | 'multiple' | 'open'
  options: TestOption[]
  explanation?: string
  strictMatch?: boolean // Требуется ли точное совпадение ответа (для открытых вопросов)
  hideOptionsInPDF?: boolean // Скрывать варианты ответа в PDF (только вопрос)
  points?: number // Баллы за вопрос (по умолчанию 1)
}

export interface TestOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface TestVariant {
  id: string
  variantNumber: number
  title?: string // Опциональное название варианта
}

export interface GeneratedTest {
  id: string
  title: string
  description?: string
  subject?: string
  class_level?: string
  questions: TestQuestion[]
  variants?: TestVariant[] // Варианты теста
  created_at: string
  updated_at: string
}

export interface PDFGenerationRequest {
  testId: string
  title: string
  description?: string
  questions: TestQuestion[]
  format: 'A4' | 'Letter'
  answerType: 'circles' | 'squares'
  variant: number
}

export interface PDFGenerationResponse {
  success: boolean
  downloadUrl?: string
  error?: string
}