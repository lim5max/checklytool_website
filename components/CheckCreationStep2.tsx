"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, ChevronDown, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  type Answer,
  type GradingCriteria,
  type EssayGradingCriteria,
  type EssayAspects,
  type EssayDescriptiveCriteria,
  type WorkType
} from "@/lib/check-creation-validation"

interface Variant {
  id: string
  name: string
  answers: Answer[]
}

interface CheckCreationStep2Props {
  workType?: WorkType | null
  gradingCriteria?: GradingCriteria
  onGradingCriteriaChange?: (criteria: GradingCriteria) => void
  essayGradingCriteria?: EssayGradingCriteria
  onEssayGradingCriteriaChange?: (criteria: EssayGradingCriteria) => void
  essayAspects?: EssayAspects
  onEssayAspectsChange?: (aspects: EssayAspects) => void
  essayDescriptiveCriteria?: EssayDescriptiveCriteria
  onEssayDescriptiveCriteriaChange?: (criteria: EssayDescriptiveCriteria) => void
  checkingMethod?: "manual" | "ai"
  onCheckingMethodChange?: (method: "manual" | "ai") => void
  answers?: Answer[]
  onAnswersChange?: (answers: Answer[]) => void
  variants?: Variant[]
  onVariantsChange?: (variants: Variant[]) => void
  customPrompt?: string
  onCustomPromptChange?: (prompt: string) => void
  onContinue?: () => void
  onBack?: () => void
  onAddVariant?: () => void
  validationErrors?: Record<string, string[]>
  isLoading?: boolean
  selectedTest?: {
    id: string
    title: string
    description?: string
    created_at: string
    question_count: number
  } | null
}

export default function CheckCreationStep2({
  workType = null,
  gradingCriteria = {
    excellent: 85,
    good: 70,
    satisfactory: 55,
    unsatisfactory: 25
  },
  onGradingCriteriaChange,
  essayGradingCriteria = {
    grammar: 40,
    spelling: 30,
    punctuation: 30
  },
  essayAspects = {
    grammar: true,
    spelling: true,
    punctuation: true,
    structure: true,
    logic: true,
    style: false
  },
  onEssayAspectsChange,
  essayDescriptiveCriteria = {
    excellent: "Структура соблюдена, логика ясная, ошибок мало или совсем нет",
    good: "Структура есть, логика в целом понятна, ошибок немного",
    satisfactory: "Структура нарушена, логика местами сбивается, ошибок достаточно много",
    unsatisfactory: "Структура отсутствует, логики почти нет, ошибок очень много"
  },
  onEssayDescriptiveCriteriaChange,
  checkingMethod = "manual",
  onCheckingMethodChange,
  // answers = [],
  onAnswersChange,
  variants: variantsProp,
  onVariantsChange,
  onContinue,
  onBack,
  // onAddVariant,
  // validationErrors = {},
  isLoading = false,
  selectedTest = null
}: CheckCreationStep2Props) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [criteria, setCriteria] = useState<GradingCriteria>(gradingCriteria)
  const [, setEssayCriteria] = useState<EssayGradingCriteria>(essayGradingCriteria || { grammar: 40, spelling: 30, punctuation: 30 })
  const [variants, setVariants] = useState<Variant[]>(variantsProp || [
    {
      id: "variant-1",
      name: "Вариант 1",
      answers: []
    }
  ])
  const [showValidation, setShowValidation] = useState(false)
  
  // Check if current work type is essay or test
  const isEssay = workType?.id === 'essay'
  const isTest = workType?.id === 'test'
  
  // Sync internal state with props
  useEffect(() => {
    setCriteria(gradingCriteria)
  }, [gradingCriteria])
  
  useEffect(() => {
    setEssayCriteria(essayGradingCriteria || { grammar: 40, spelling: 30, punctuation: 30 })
  }, [essayGradingCriteria])

  // Sync variants with props when they change (e.g., when test is selected)
  useEffect(() => {
    if (variantsProp) {
      setVariants(variantsProp)
    }
  }, [variantsProp])

  // Initialize with first empty answer if no answers provided
  useEffect(() => {
    if (variants[0].answers.length === 0) {
      const initialAnswer: Answer = {
        id: Date.now().toString(),
        value: ""
      }
      const newVariants = variants.map(variant =>
        variant.id === "variant-1"
          ? { ...variant, answers: [initialAnswer] }
          : variant
      )
      // Notify parent component about the initialized state
      notifyVariantsChange(newVariants)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // useEffect(() => {
  //   setPrompt(customPrompt || "")
  // }, [customPrompt])

  const updateCriteria = (key: keyof GradingCriteria, value: number) => {
    const newCriteria = { ...criteria, [key]: value }
    setCriteria(newCriteria)
    onGradingCriteriaChange?.(newCriteria)
  }

  const updateEssayDescriptiveCriteria = (key: keyof EssayDescriptiveCriteria, value: string) => {
    const newCriteria = { ...essayDescriptiveCriteria, [key]: value }
    onEssayDescriptiveCriteriaChange?.(newCriteria)
  }

  // const updateEssayCriteria = (key: keyof EssayGradingCriteria, value: number) => {
  //   const newCriteria = { ...essayCriteria, [key]: value }
  //   setEssayCriteria(newCriteria)
  //   onEssayGradingCriteriaChange?.(newCriteria)
  // }

  // const updateCustomPrompt = (value: string) => {
  //   setPrompt(value)
  //   onCustomPromptChange?.(value)
  // }

  // Notify parent component when variants change
  const notifyVariantsChange = (newVariants: Variant[]) => {
    setVariants(newVariants)
    onVariantsChange?.(newVariants)
  }

  const updateAnswer = (variantId: string, answerId: string, value: string) => {
    // Reset validation state when user starts typing
    if (showValidation) {
      setShowValidation(false)
    }
    
    const newVariants = variants.map(variant => 
      variant.id === variantId
        ? {
            ...variant,
            answers: variant.answers.map(answer => 
              answer.id === answerId ? { ...answer, value } : answer
            )
          }
        : variant
    )
    notifyVariantsChange(newVariants)
  }

  const addAnswer = (variantId: string) => {
    const newAnswer: Answer = {
      id: Date.now().toString(),
      value: ""
    }
    const newVariants = variants.map(variant => 
      variant.id === variantId
        ? { ...variant, answers: [...variant.answers, newAnswer] }
        : variant
    )
    notifyVariantsChange(newVariants)
  }

  const removeAnswer = (variantId: string, answerId: string) => {
    const newVariants = variants.map(variant => 
      variant.id === variantId
        ? { ...variant, answers: variant.answers.filter(answer => answer.id !== answerId) }
        : variant
    )
    notifyVariantsChange(newVariants)
  }

  const addVariant = () => {
    const newVariantNumber = variants.length + 1
    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      name: `Вариант ${newVariantNumber}`,
      answers: [{
        id: Date.now().toString(),
        value: ""
      }]
    }
    notifyVariantsChange([...variants, newVariant])
  }

  const removeVariant = (variantId: string) => {
    if (variants.length > 1) {
      const filtered = variants.filter(variant => variant.id !== variantId)
      // Перенумеровываем варианты после удаления
      const renumbered = filtered.map((variant, index) => ({
        ...variant,
        name: `Вариант ${index + 1}`
      }))
      notifyVariantsChange(renumbered)
    }
  }

  const handleMethodChange = (method: "manual" | "ai") => {
    // For essays, only AI method is allowed
    if (isEssay && method === "manual") {
      return
    }

    // For selected tests, only AI method is allowed
    if (selectedTest && method === "manual") {
      return
    }

    // Reset validation state when method changes
    setShowValidation(false)

    onCheckingMethodChange?.(method)
    // Auto-collapse criteria section when AI is selected
    if (method === "ai") {
      setIsCollapsed(true)
    }
  }

  // Validation function to check if answers are filled
  const validateAnswers = (): { isValid: boolean; error?: string } => {
    // For AI method, no validation needed for answers
    if (checkingMethod === "ai") {
      return { isValid: true }
    }

    // For essays with manual method, skip answer validation
    if (isEssay && checkingMethod === "manual") {
      return { isValid: true }
    }

    // For manual method with tests, check all answers are filled
    for (const variant of variants) {
      for (const answer of variant.answers) {
        if (!answer.value || answer.value.trim() === "") {
          return {
            isValid: false,
            error: `Пожалуйста, заполните все ответы в ${variant.name.toLowerCase()}`
          }
        }
      }
    }

    return { isValid: true }
  }

  // Check if form is valid (all answers filled when required)
  const isFormValid = (): boolean => {
    return validateAnswers().isValid
  }

  const handleContinue = () => {
    // Show validation state when user tries to submit
    setShowValidation(true)
    
    // Validate answers before proceeding
    const validation = validateAnswers()
    
    if (!validation.isValid) {
      // Show error message to user
      toast.error(validation.error || "Пожалуйста, заполните все ответы")
      return
    }

    // Update parent state with current variants data
    // Only save if manual method
    // If test is selected, don't save answers (they come from the test)
    if (onAnswersChange && checkingMethod === "manual") {
      // Flatten all answers from all variants for the parent component
      const allAnswers = variants.flatMap(variant => variant.answers)
      onAnswersChange(allAnswers)
    }

    // Make sure parent has latest variants data
    onVariantsChange?.(variants)

    onContinue?.()
  }

  return (
    <div className="bg-white flex flex-col gap-2.5 items-center justify-start p-[16px] pb-[100px] relative min-h-screen">
      <div className="flex flex-col gap-[18px] items-end justify-start relative shrink-0 w-full">
        {/* Main content */}
        <div className="flex flex-col gap-6 items-start justify-start relative shrink-0 w-full">
          {/* Title section with back arrow */}
          <div className="flex flex-col gap-6 items-start justify-start relative shrink-0 w-full">
            <div className="flex gap-[6.095px] items-start justify-start relative shrink-0">
              <button 
                onClick={onBack}
                className="relative shrink-0 size-8"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="font-nunito font-black leading-[0] relative shrink-0 text-[28px] text-nowrap text-slate-800">
              <p className="leading-[1.2] whitespace-pre">Создание проверки</p>
            </div>
          </div>

        {/* Selected Test Information */}
        {selectedTest && (
          <div className="bg-green-50 border border-green-200 rounded-[32px] p-6 w-full">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-nunito font-bold text-lg text-green-900">
                  Выбранный тест: {selectedTest.title}
                </h3>
                <div className="text-green-800 space-y-1">
                  {selectedTest.description && (
                    <p className="text-sm">{selectedTest.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span>Вопросов: {selectedTest.question_count || 'Неизвестно'}</span>
                    {selectedTest.created_at && (
                      <span>Создан: {new Date(selectedTest.created_at).toLocaleDateString('ru-RU')}</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-green-700">
                  ✨ Проверка будет автоматически выполнена с помощью ИИ
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Essay Aspects Section - Show only for essays */}
        {isEssay && (
          <div className="content-stretch flex flex-col gap-4 items-start justify-start relative shrink-0 w-full">
            <div className="content-stretch flex gap-2.5 items-center justify-start relative shrink-0 w-full">
              <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                <p className="leading-[1.2] whitespace-pre">Аспекты проверки</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full">
              {Object.entries({
                grammar: 'Грамматика',
                spelling: 'Орфография',
                punctuation: 'Пунктуация',
                structure: 'Структура',
                logic: 'Логика изложения',
                style: 'Стиль изложения'
              }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    const newAspects = { ...essayAspects, [key]: !essayAspects[key as keyof EssayAspects] }
                    onEssayAspectsChange?.(newAspects)
                  }}
                  className={`${
                    essayAspects[key as keyof EssayAspects]
                      ? "bg-[#096ff5] text-white"
                      : "bg-slate-100 text-slate-700"
                  } px-4 py-2 rounded-full text-sm font-medium transition-colors`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grading Criteria Section */}
        <div className="bg-slate-50 box-border content-stretch flex flex-col gap-2.5 items-start justify-start px-6 py-7 relative rounded-[32px] shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-4 items-start justify-start relative shrink-0 w-full">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="content-stretch flex items-center justify-between relative shrink-0 w-full cursor-pointer"
            >
              <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                <p className="leading-[1.2] whitespace-pre">Критерии оценки</p>
              </div>
              <div className="relative shrink-0 size-6">
                <ChevronDown 
                  className={`w-6 h-6 text-slate-600 transition-transform ${
                    isCollapsed ? "" : "rotate-180"
                  }`} 
                />
              </div>
            </button>
            
            {/* Criteria content - only show when not collapsed */}
            {!isCollapsed && (
              <div className="space-y-3 md:space-y-4 w-full">
                {isEssay ? (
                  // Descriptive criteria for essays - NOW EDITABLE
                  <>
                    {/* Excellent (5) */}
                    <div className="space-y-2">
                      <div className="font-inter font-semibold text-[16px] leading-[1.6] text-slate-800">
                        Отлично (5 баллов):
                      </div>
                      <div className="bg-white rounded-[20px] border border-slate-200">
                        <textarea
                          value={essayDescriptiveCriteria?.excellent}
                          onChange={(e) => updateEssayDescriptiveCriteria('excellent', e.target.value)}
                          placeholder="Опишите критерии для отличной оценки"
                          className="font-inter text-[14px] leading-[1.6] text-slate-700 w-full p-4 bg-transparent border-none outline-none resize-none min-h-[80px] placeholder:text-slate-400"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Good (4) */}
                    <div className="space-y-2">
                      <div className="font-inter font-semibold text-[16px] leading-[1.6] text-slate-800">
                        Хорошо (4 балла):
                      </div>
                      <div className="bg-white rounded-[20px] border border-slate-200">
                        <textarea
                          value={essayDescriptiveCriteria?.good}
                          onChange={(e) => updateEssayDescriptiveCriteria('good', e.target.value)}
                          placeholder="Опишите критерии для хорошей оценки"
                          className="font-inter text-[14px] leading-[1.6] text-slate-700 w-full p-4 bg-transparent border-none outline-none resize-none min-h-[80px] placeholder:text-slate-400"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Satisfactory (3) */}
                    <div className="space-y-2">
                      <div className="font-inter font-semibold text-[16px] leading-[1.6] text-slate-800">
                        Удовлетворительно (3 балла):
                      </div>
                      <div className="bg-white rounded-[20px] border border-slate-200">
                        <textarea
                          value={essayDescriptiveCriteria?.satisfactory}
                          onChange={(e) => updateEssayDescriptiveCriteria('satisfactory', e.target.value)}
                          placeholder="Опишите критерии для удовлетворительной оценки"
                          className="font-inter text-[14px] leading-[1.6] text-slate-700 w-full p-4 bg-transparent border-none outline-none resize-none min-h-[80px] placeholder:text-slate-400"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Unsatisfactory (2) */}
                    <div className="space-y-2">
                      <div className="font-inter font-semibold text-[16px] leading-[1.6] text-slate-800">
                        Неудовлетворительно (2 балла):
                      </div>
                      <div className="bg-white rounded-[20px] border border-slate-200">
                        <textarea
                          value={essayDescriptiveCriteria?.unsatisfactory}
                          onChange={(e) => updateEssayDescriptiveCriteria('unsatisfactory', e.target.value)}
                          placeholder="Опишите критерии для неудовлетворительной оценки"
                          className="font-inter text-[14px] leading-[1.6] text-slate-700 w-full p-4 bg-transparent border-none outline-none resize-none min-h-[80px] placeholder:text-slate-400"
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  // Percentage-based criteria for tests - Airbnb style
                  <div className="space-y-6">
                    {/* Excellent (5) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-inter font-semibold text-[16px] text-slate-800">
                          Отлично (5)
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={criteria.excellent}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val)))
                              updateCriteria("excellent", num)
                            }}
                            className="w-16 h-10 text-center font-semibold text-lg bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
                            %
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={criteria.excellent}
                          onChange={(e) => updateCriteria("excellent", parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer focus:outline-none
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                            [&::-webkit-slider-thumb]:from-green-400 [&::-webkit-slider-thumb]:to-green-600
                            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-green-400
                            [&::-moz-range-thumb]:to-green-600 [&::-moz-range-thumb]:shadow-lg
                            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform"
                          style={{
                            background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${criteria.excellent}%, rgb(226, 232, 240) ${criteria.excellent}%, rgb(226, 232, 240) 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Good (4) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-inter font-semibold text-[16px] text-slate-800">
                          Хорошо (4)
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={criteria.good}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val)))
                              updateCriteria("good", num)
                            }}
                            className="w-16 h-10 text-center font-semibold text-lg bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
                            %
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={criteria.good}
                          onChange={(e) => updateCriteria("good", parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer focus:outline-none
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                            [&::-webkit-slider-thumb]:from-blue-400 [&::-webkit-slider-thumb]:to-blue-600
                            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-blue-400
                            [&::-moz-range-thumb]:to-blue-600 [&::-moz-range-thumb]:shadow-lg
                            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform"
                          style={{
                            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${criteria.good}%, rgb(226, 232, 240) ${criteria.good}%, rgb(226, 232, 240) 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Satisfactory (3) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-inter font-semibold text-[16px] text-slate-800">
                          Удовл. (3)
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={criteria.satisfactory}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val)))
                              updateCriteria("satisfactory", num)
                            }}
                            className="w-16 h-10 text-center font-semibold text-lg bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
                            %
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={criteria.satisfactory}
                          onChange={(e) => updateCriteria("satisfactory", parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer focus:outline-none
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                            [&::-webkit-slider-thumb]:from-yellow-400 [&::-webkit-slider-thumb]:to-orange-500
                            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-yellow-400
                            [&::-moz-range-thumb]:to-orange-500 [&::-moz-range-thumb]:shadow-lg
                            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform"
                          style={{
                            background: `linear-gradient(to right, rgb(251, 146, 60) 0%, rgb(251, 146, 60) ${criteria.satisfactory}%, rgb(226, 232, 240) ${criteria.satisfactory}%, rgb(226, 232, 240) 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Unsatisfactory (2) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-inter font-semibold text-[16px] text-slate-800">
                          Неудовл. (2)
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={criteria.unsatisfactory}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val)))
                              updateCriteria("unsatisfactory", num)
                            }}
                            className="w-16 h-10 text-center font-semibold text-lg bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">
                            %
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={criteria.unsatisfactory}
                          onChange={(e) => updateCriteria("unsatisfactory", parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer focus:outline-none
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                            [&::-webkit-slider-thumb]:from-red-400 [&::-webkit-slider-thumb]:to-red-600
                            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-red-400
                            [&::-moz-range-thumb]:to-red-600 [&::-moz-range-thumb]:shadow-lg
                            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform"
                          style={{
                            background: `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(239, 68, 68) ${criteria.unsatisfactory}%, rgb(226, 232, 240) ${criteria.unsatisfactory}%, rgb(226, 232, 240) 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-1 text-xs text-slate-500">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Checking Method Section - Hide when test is selected or essay is selected */}
        {!selectedTest && !isEssay && (
          <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
          <div className="content-stretch flex gap-2.5 items-center justify-start relative shrink-0 w-full">
            <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
              <p className="leading-[1.2] whitespace-pre">Проверка через</p>
            </div>
          </div>
          <div className="content-stretch flex gap-1.5 items-start justify-start relative shrink-0 w-full">
            <button
              onClick={() => handleMethodChange("manual")}
              disabled={isEssay || !!selectedTest}
              className={`${
                checkingMethod === "manual"
                  ? "bg-[#096ff5]"
                  : "bg-slate-50"
              } box-border content-stretch flex flex-col gap-2.5 h-12 items-start justify-center overflow-clip px-[21px] py-[11px] relative rounded-[27px] shrink-0 ${
                (isEssay || selectedTest) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
                <div className={`font-inter font-medium leading-[0] not-italic relative shrink-0 text-[14px] text-center text-nowrap ${
                  checkingMethod === "manual" ? "text-white" : "text-slate-500"
                }`}>
                  <p className="leading-[1.6] whitespace-pre">Свои ответы</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleMethodChange("ai")}
              className={`${
                checkingMethod === "ai" 
                  ? "bg-[#096ff5]" 
                  : "bg-slate-50"
              } box-border content-stretch flex flex-col gap-2.5 h-12 items-start justify-center overflow-clip px-[21px] py-[11px] relative rounded-[27px] shrink-0`}
            >
              <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
                <div className={`font-inter font-medium leading-[0] not-italic relative shrink-0 text-[14px] text-center text-nowrap ${
                  checkingMethod === "ai" ? "text-white" : "text-slate-500"
                }`}>
                  <p className="leading-[1.6] whitespace-pre">Нейросеть</p>
                </div>
              </div>
            </button>
          </div>
        </div>
        )}

        {/* Test Information Section - Show only for tests and NOT when selectedTest */}
        {isTest && !selectedTest && (
          <div className="bg-blue-50 border border-blue-200 rounded-[32px] p-6 w-full">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ℹ
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-nunito font-bold text-lg text-blue-900">
                  Используйте стандартный бланк теста
                </h3>
                <div className="text-blue-800 space-y-2">
                  <p>
                    Для точной проверки ИИ создавайте тесты в <strong>Конструкторе тестов</strong> и скачивайте стандартизированные PDF бланки.
                  </p>
                  <div className="text-sm space-y-1">
                    <p>• Стандартные поля для ответов (A, B, C, D)</p>
                    <p>• Четкая нумерация вопросов</p>
                    <p>• Оптимальный формат для распознавания ИИ</p>
                  </div>
                </div>
                <div className="pt-2">
                  <a
                    href="/dashboard/test-builder"
                    target="_blank"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Открыть Конструктор тестов
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Variant Section - Show when manual method is selected (and not a test) */}
        {(checkingMethod === "manual" && !isTest) && (
          <>
            {/* All Variants */}
            {variants.map((variant) => (
              <div key={variant.id} className="content-stretch flex flex-col gap-4 items-start justify-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-3 items-start justify-start relative shrink-0 w-full">
                  <div className="content-stretch flex gap-2.5 items-center justify-between relative shrink-0 w-full">
                    <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                      <p className="leading-[1.2] whitespace-pre">{variant.name}</p>
                    </div>
                    {variants.length > 1 && (
                      <button
                        onClick={() => removeVariant(variant.id)}
                        className="relative shrink-0 size-6 flex items-center justify-center hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                  
                  {/* Answer List for this variant */}
                  {variant.answers.map((answer, index) => (
                    <div key={answer.id} className="content-stretch flex items-center justify-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col gap-2.5 items-start justify-center relative shrink-0 w-7">
                        <div className="font-inter font-semibold leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center text-nowrap">
                          <p className="leading-[1.6] whitespace-pre">{index + 1}.</p>
                        </div>
                      </div>
                      <div className={`basis-0 grow h-14 min-h-px min-w-px relative rounded-[27px] shrink-0 ${
                        showValidation && answer.value.trim() === "" ? "bg-red-50" : "bg-slate-50"
                      }`}>
                        <div className="box-border content-stretch flex gap-2.5 h-14 items-center justify-start overflow-clip px-[21px] py-[11px] relative w-full">
                          <input
                            value={answer.value}
                            onChange={(e) => updateAnswer(variant.id, answer.id, e.target.value)}
                            placeholder="Введите ответ"
                            className="font-inter font-medium leading-[0] not-italic text-[16px] text-left text-slate-800 bg-transparent border-none outline-none w-full placeholder:text-slate-500"
                          />
                        </div>
                        <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[27px] ${
                          showValidation && answer.value.trim() === "" ? "border-red-200" : "border-slate-100"
                        }`} />
                      </div>
                      <div className="content-stretch flex gap-2.5 items-center justify-center relative shrink-0 size-[52px]">
                        <button
                          onClick={() => removeAnswer(variant.id, answer.id)}
                          disabled={variant.answers.length <= 1}
                          className="relative shrink-0 size-[19px]"
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Answer Button for this variant */}
                  <div className="bg-slate-50 h-14 relative rounded-[27px] shrink-0 w-full">
                    <button
                      onClick={() => addAnswer(variant.id)}
                      className="box-border content-stretch flex gap-2.5 h-14 items-center justify-start overflow-clip px-[21px] py-[11px] relative w-full text-left"
                    >
                      <div className="font-inter font-medium leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap text-slate-500">
                        <p className="leading-[1.6] whitespace-pre">Добавить ответ</p>
                      </div>
                    </button>
                    <div aria-hidden="true" className="absolute border border-slate-100 border-solid inset-0 pointer-events-none rounded-[27px]" />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Variant Button */}
            <div className="bg-slate-100 box-border content-stretch flex gap-2.5 h-12 items-center justify-center overflow-clip px-[43px] py-4 relative rounded-[180px] shrink-0 w-full">
              <button
                onClick={addVariant}
                className="flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap text-slate-800"
              >
                <p className="leading-[1.6] whitespace-pre">Добавить вариант</p>
              </button>
            </div>
          </>
        )}
        </div>
      </div>
      
      {/* Sticky Bottom Button */}
      <div className="fixed bg-white bottom-0 box-border flex flex-col gap-2.5 h-[82px] items-center justify-center left-0 px-[18px] py-0 right-0 z-50">
        <div className="absolute border-t border-slate-200 border-solid inset-0 pointer-events-none" />
        <button
          onClick={handleContinue}
          disabled={isLoading || !isFormValid()}
          className={`box-border flex gap-2.5 h-14 items-center justify-center overflow-clip px-[43px] py-4 relative rounded-[180px] shrink-0 w-full transition-colors ${
            isLoading || !isFormValid()
              ? "bg-slate-300 cursor-not-allowed" 
              : "bg-[#096ff5] hover:bg-[#0857c4]"
          }`}
        >
          <div className={`flex flex-col font-inter font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap ${
            isLoading || !isFormValid() ? "text-slate-500" : "text-white"
          }`}>
            <p className="leading-[1.6] whitespace-pre">Начать проверку</p>
          </div>
        </button>
      </div>
    </div>
  )
}