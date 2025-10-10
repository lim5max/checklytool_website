import { z } from 'zod'
import { type CreateCheckFormData } from '@/lib/validations/check'

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

// Essay aspects that can be checked
export interface EssayAspects {
  grammar: boolean     // Грамматика
  spelling: boolean    // Орфография
  punctuation: boolean // Пунктуация
  structure: boolean   // Структура
  logic: boolean       // Логика изложения
  style: boolean       // Стиль изложения
}

// Descriptive grading criteria for essays (instead of percentages)
export interface EssayDescriptiveCriteria {
  excellent: string    // 5 баллов
  good: string         // 4 балла
  satisfactory: string // 3 балла
  unsatisfactory: string // 2 балла
}

export interface Answer {
  id: string
  value: string
}

export interface CheckCreationData {
  workTitle: string
  workType: WorkType | null
  gradingCriteria: GradingCriteria
  essayGradingCriteria?: EssayGradingCriteria // For essay type only (old system)
  essayAspects?: EssayAspects // What aspects to check in essays
  essayDescriptiveCriteria?: EssayDescriptiveCriteria // Descriptive criteria for essays
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
  const workTypeId = uiData.workType?.id
  const isEssay = workTypeId === 'essay'
  const isWrittenWork = workTypeId === 'written_work'

  let checkType: 'test' | 'essay' | 'written_work' = 'test'
  if (isEssay) checkType = 'essay'
  else if (isWrittenWork) checkType = 'written_work'

  const apiData: CreateCheckFormData = {
    title: uiData.workTitle,
    description: `${isEssay ? 'Сочинение' : isWrittenWork ? 'Контрольная работа' : 'Тест'}: ${uiData.workType?.title || 'Неизвестный тип'}`,
    variant_count: variantCount || 1,
    subject: uiData.workType?.title,
    class_level: undefined,
    total_questions: uiData.answers?.length || undefined,
    check_type: checkType
  }

  if (isEssay && uiData.essayDescriptiveCriteria) {
    // For essays, use descriptive criteria from UI
    apiData.essay_grading_criteria = [
      {
        grade: 5 as const,
        title: 'Отлично (5 баллов)',
        description: uiData.essayDescriptiveCriteria.excellent
      },
      {
        grade: 4 as const,
        title: 'Хорошо (4 балла)',
        description: uiData.essayDescriptiveCriteria.good
      },
      {
        grade: 3 as const,
        title: 'Удовлетворительно (3 балла)',
        description: uiData.essayDescriptiveCriteria.satisfactory
      },
      {
        grade: 2 as const,
        title: 'Неудовлетворительно (2 балла)',
        description: uiData.essayDescriptiveCriteria.unsatisfactory
      }
    ]
  } else {
    // For tests, use percentage-based criteria
    apiData.grading_criteria = [
      { grade: 5 as const, min_percentage: uiData.gradingCriteria.excellent },
      { grade: 4 as const, min_percentage: uiData.gradingCriteria.good },
      { grade: 3 as const, min_percentage: uiData.gradingCriteria.satisfactory },
      { grade: 2 as const, min_percentage: uiData.gradingCriteria.unsatisfactory }
    ]
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
  } catch {
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
  { id: "test", title: "Тест" },
  { id: "written_work", title: "Контрольная работа" },
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

// Default essay aspects (all enabled by default)
export const DEFAULT_ESSAY_ASPECTS: EssayAspects = {
  grammar: true,
  spelling: true,
  punctuation: true,
  structure: true,
  logic: true,
  style: false // Optional by default
}

// Default descriptive criteria for essays
export const DEFAULT_ESSAY_DESCRIPTIVE_CRITERIA: EssayDescriptiveCriteria = {
  excellent: "Структура соблюдена, логика ясная, ошибок мало или совсем нет (не более двух грамматических ошибок)",
  good: "Структура есть, логика в целом понятна, ошибок немного (от 3 до 6 грамматических и синтаксических)",
  satisfactory: "Структура нарушена (например, нет заключения), логика местами сбивается, ошибок достаточно много (более 6 ошибок грамматических и синтаксических)",
  unsatisfactory: "Структура отсутствует, логики почти нет, ошибок очень много, текст трудно читать"
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