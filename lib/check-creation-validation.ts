import { z } from 'zod'
import { createCheckSchema, type CreateCheckFormData } from '@/lib/validations/check'

// UI Component Types (what our mobile components use)
export interface WorkType {
  id: string
  title: string
}

export interface GradingCriteria {
  excellent: number
  good: number
  satisfactory: number
  unsatisfactory: number
}

// Essay-specific criteria for grammar, spelling, punctuation
export interface EssayGradingCriteria {
  grammar: number // Weight for grammar errors
  spelling: number // Weight for spelling errors  
  punctuation: number // Weight for punctuation errors
}

export interface Answer {
  id: string
  value: string
}

export interface CheckCreationData {
  workTitle: string
  workType: WorkType | null
  gradingCriteria: GradingCriteria
  essayGradingCriteria?: EssayGradingCriteria // For essay type only
  checkingMethod: "manual" | "ai"
  answers: Answer[]
  variants?: VariantData[] // Add variants support
  customPrompt?: string // Custom prompt for AI evaluation (essays)
}

export interface VariantData {
  id: string
  name: string
  answers: Answer[]
}

// Client-side validation schema for our mobile UI
export const mobileCheckCreationSchema = z.object({
  workTitle: z.string()
    .min(1, 'Название работы обязательно')
    .max(200, 'Название не может быть длиннее 200 символов'),
  workType: z.object({
    id: z.string(),
    title: z.string()
  }).nullable().refine(val => val !== null, 'Выберите тип работы'),
  gradingCriteria: z.object({
    excellent: z.number()
      .int('Процент должен быть целым числом')
      .min(0, 'Процент не может быть отрицательным')
      .max(100, 'Процент не может быть больше 100'),
    good: z.number()
      .int('Процент должен быть целым числом')
      .min(0, 'Процент не может быть отрицательным')
      .max(100, 'Процент не может быть больше 100'),
    satisfactory: z.number()
      .int('Процент должен быть целым числом')
      .min(0, 'Процент не может быть отрицательным')
      .max(100, 'Процент не может быть больше 100'),
    unsatisfactory: z.number()
      .int('Процент должен быть целым числом')
      .min(0, 'Процент не может быть отрицательным')
      .max(100, 'Процент не может быть больше 100')
  }).refine((criteria) => {
    // Validate that grading criteria are in descending order
    return criteria.excellent >= criteria.good && 
           criteria.good >= criteria.satisfactory && 
           criteria.satisfactory >= criteria.unsatisfactory
  }, 'Критерии оценки должны убывать: Отлично ≥ Хорошо ≥ Удовлетворительно ≥ Неудовлетворительно'),
  essayGradingCriteria: z.object({
    grammar: z.number().int().min(0).max(100),
    spelling: z.number().int().min(0).max(100), 
    punctuation: z.number().int().min(0).max(100)
  }).optional(),
  checkingMethod: z.enum(["manual", "ai"]),
  answers: z.array(z.object({
    id: z.string(),
    value: z.string().min(1, 'Ответ не может быть пустым')
  })).min(0).max(100), // Essays don't need answers
  customPrompt: z.string().optional()
}).refine((data) => {
  // For essays, answers are optional but custom prompt is recommended
  if (data.workType?.id === 'essay') {
    return data.checkingMethod === 'ai' ? true : data.answers.length === 0
  }
  // For tests, answers are required when manual checking
  if (data.workType?.id === 'test' && data.checkingMethod === 'manual') {
    return data.answers.length >= 1
  }
  return true
}, 'Для тестов требуются ответы при ручной проверке')

export type ValidatedCheckCreationData = z.infer<typeof mobileCheckCreationSchema>

// Data mapping function: Convert UI data to API format
export function mapUIDataToAPI(uiData: CheckCreationData, variantCount?: number): CreateCheckFormData {
  // Map grading criteria from our UI format to API format
  const gradingCriteriaArray = [
    { grade: 5 as const, min_percentage: uiData.gradingCriteria.excellent },
    { grade: 4 as const, min_percentage: uiData.gradingCriteria.good },
    { grade: 3 as const, min_percentage: uiData.gradingCriteria.satisfactory },
    { grade: 2 as const, min_percentage: uiData.gradingCriteria.unsatisfactory }
  ]

  const apiData: CreateCheckFormData = {
    title: uiData.workTitle,
    description: `Проверочная работа: ${uiData.workType?.title || 'Неизвестный тип'}`,
    variant_count: variantCount || 1, // Use provided variant count or default to 1
    subject: uiData.workType?.title,
    class_level: undefined, // Optional field, not collected in mobile UI yet
    total_questions: uiData.answers.length,
    grading_criteria: gradingCriteriaArray
  }

  return apiData
}

// Validation function with detailed error messages
export function validateCheckCreationData(data: CheckCreationData): {
  isValid: boolean
  errors: Record<string, string[]>
  validatedData?: ValidatedCheckCreationData
} {
  try {
    const validatedData = mobileCheckCreationSchema.parse(data)
    return {
      isValid: true,
      errors: {},
      validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      
      return {
        isValid: false,
        errors
      }
    }
    
    return {
      isValid: false,
      errors: { general: ['Произошла ошибка валидации'] }
    }
  }
}

// Step-specific validation functions
export function validateStep1(data: Pick<CheckCreationData, 'workTitle' | 'workType'>): {
  isValid: boolean
  errors: Record<string, string[]>
} {
  const step1Schema = mobileCheckCreationSchema.pick({
    workTitle: true,
    workType: true
  })
  
  try {
    step1Schema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: ['Произошла ошибка валидации'] } }
  }
}

export function validateStep2(data: Pick<CheckCreationData, 'gradingCriteria' | 'checkingMethod' | 'answers'>): {
  isValid: boolean
  errors: Record<string, string[]>
} {
  const step2Schema = mobileCheckCreationSchema.pick({
    gradingCriteria: true,
    checkingMethod: true,
    answers: true
  })
  
  try {
    step2Schema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: ['Произошла ошибка валидации'] } }
  }
}

// API response validation
export function validateAPIResponse(response: unknown): {
  isValid: boolean
  error?: string
  data?: { check: { id: string; [key: string]: unknown } }
} {
  try {
    const responseSchema = z.object({
      check: z.object({
        id: z.string(),
      }).passthrough(),
      message: z.string().optional()
    })
    
    const validatedResponse = responseSchema.parse(response)
    return {
      isValid: true,
      data: validatedResponse
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Неожиданный формат ответа от сервера'
    }
  }
}

// Error message helpers for UI
export function getFieldErrorMessage(errors: Record<string, string[]>, fieldPath: string): string | null {
  const fieldErrors = errors[fieldPath]
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null
}

export function hasFieldError(errors: Record<string, string[]>, fieldPath: string): boolean {
  return errors[fieldPath] && errors[fieldPath].length > 0
}

// Pre-defined work types with validation
export const WORK_TYPES: WorkType[] = [
  { id: "test", title: "Контрольная или тест" },
  { id: "essay", title: "Сочинение" }
] as const

export const DEFAULT_GRADING_CRITERIA: GradingCriteria = {
  excellent: 85,
  good: 70,
  satisfactory: 55,
  unsatisfactory: 25
}

export const DEFAULT_ESSAY_GRADING_CRITERIA: EssayGradingCriteria = {
  grammar: 40,
  spelling: 30,
  punctuation: 30
}

export const DEFAULT_ANSWERS: Answer[] = [
  { id: "1", value: "Верно" },
  { id: "2", value: "5" }
]

// Default custom prompt for essays
export const DEFAULT_ESSAY_PROMPT = `Оцените данное сочинение по критериям грамотности:

1. Орфография (правильность написания слов)
2. Пунктуация (правильность расстановки знаков препинания)
3. Грамматика (правильное согласование слов, строение предложений)

Укажите количество ошибок по каждому критерию и общую оценку.`