"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ChevronDown, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  type Answer,
  type GradingCriteria,
  type EssayGradingCriteria,
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
  onEssayGradingCriteriaChange,
  checkingMethod = "manual",
  onCheckingMethodChange,
  // answers = [],
  onAnswersChange,
  variants: variantsProp,
  onVariantsChange,
  customPrompt = "",
  onCustomPromptChange,
  onContinue,
  onBack,
  // onAddVariant,
  // validationErrors = {},
  isLoading = false
}: CheckCreationStep2Props) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [criteria, setCriteria] = useState<GradingCriteria>(gradingCriteria)
  const [essayCriteria, setEssayCriteria] = useState<EssayGradingCriteria>(essayGradingCriteria || { grammar: 40, spelling: 30, punctuation: 30 })
  const [variants, setVariants] = useState<Variant[]>(variantsProp || [
    {
      id: "variant-1",
      name: "Вариант 1",
      answers: []
    }
  ])
  const [prompt] = useState<string>(customPrompt || "")
  const [showValidation, setShowValidation] = useState(false)
  
  // Check if current work type is essay
  const isEssay = workType?.id === 'essay'
  
  // Sync internal state with props
  useEffect(() => {
    setCriteria(gradingCriteria)
  }, [gradingCriteria])
  
  useEffect(() => {
    setEssayCriteria(essayGradingCriteria || { grammar: 40, spelling: 30, punctuation: 30 })
  }, [essayGradingCriteria])
  
  // Initialize with first empty answer if no answers provided
  useEffect(() => {
    if (variants[0].answers.length === 0) {
      const initialAnswer: Answer = {
        id: Date.now().toString(),
        value: ""
      }
      setVariants(prev => prev.map(variant => 
        variant.id === "variant-1" 
          ? { ...variant, answers: [initialAnswer] }
          : variant
      ))
    }
  }, [])
  
  // useEffect(() => {
  //   setPrompt(customPrompt || "")
  // }, [customPrompt])

  const updateCriteria = (key: keyof GradingCriteria, value: number) => {
    const newCriteria = { ...criteria, [key]: value }
    setCriteria(newCriteria)
    onGradingCriteriaChange?.(newCriteria)
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
                {/* Excellent (5) */}
                <div className="flex items-center gap-4">
                  <div className="font-inter font-medium text-[16px] leading-[1.6] text-slate-800 w-28">
                    Отлично (5):
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={criteria.excellent}
                      onChange={(e) => updateCriteria("excellent", parseInt(e.target.value) || 0)}
                      className="w-full h-14 rounded-[27px] border-slate-100 bg-white pr-12"
                    />
                    <div className="absolute right-[21px] top-1/2 transform -translate-y-1/2 font-inter font-medium text-[16px] text-slate-900">
                      %
                    </div>
                  </div>
                </div>

                {/* Good (4) */}
                <div className="flex items-center gap-4">
                  <div className="font-inter font-medium text-[16px] leading-[1.6] text-slate-800 w-28">
                    Хорошо (4):
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={criteria.good}
                      onChange={(e) => updateCriteria("good", parseInt(e.target.value) || 0)}
                      className="w-full h-14 rounded-[27px] border-slate-100 bg-white pr-12"
                    />
                    <div className="absolute right-[21px] top-1/2 transform -translate-y-1/2 font-inter font-medium text-[16px] text-slate-900">
                      %
                    </div>
                  </div>
                </div>

                {/* Satisfactory (3) */}
                <div className="flex items-center gap-4">
                  <div className="font-inter font-medium text-[16px] leading-[1.6] text-slate-800 w-28">
                    Удовл. (3):
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={criteria.satisfactory}
                      onChange={(e) => updateCriteria("satisfactory", parseInt(e.target.value) || 0)}
                      className="w-full h-14 rounded-[27px] border-slate-100 bg-white pr-12"
                    />
                    <div className="absolute right-[21px] top-1/2 transform -translate-y-1/2 font-inter font-medium text-[16px] text-slate-900">
                      %
                    </div>
                  </div>
                </div>

                {/* Unsatisfactory (2) */}
                <div className="flex items-center gap-4">
                  <div className="font-inter font-medium text-[16px] leading-[1.6] text-slate-800 w-28">
                    Неудовл (2):
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={criteria.unsatisfactory}
                      onChange={(e) => updateCriteria("unsatisfactory", parseInt(e.target.value) || 0)}
                      className="w-full h-14 rounded-[27px] border-slate-100 bg-white pr-12"
                    />
                    <div className="absolute right-[21px] top-1/2 transform -translate-y-1/2 font-inter font-medium text-[16px] text-slate-900">
                      %
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checking Method Section */}
        <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
          <div className="content-stretch flex gap-2.5 items-center justify-start relative shrink-0 w-full">
            <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
              <p className="leading-[1.2] whitespace-pre">Проверка через</p>
            </div>
          </div>
          <div className="content-stretch flex gap-1.5 items-start justify-start relative shrink-0 w-full">
            <button
              onClick={() => handleMethodChange("manual")}
              disabled={isEssay}
              className={`${
                checkingMethod === "manual" 
                  ? "bg-[#096ff5]" 
                  : "bg-slate-50"
              } box-border content-stretch flex flex-col gap-2.5 h-12 items-start justify-center overflow-clip px-[21px] py-[11px] relative rounded-[27px] shrink-0 ${
                isEssay ? "opacity-50 cursor-not-allowed" : ""
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

        {/* Variant Section - Only show when manual method is selected */}
        {checkingMethod === "manual" && (
          <>
            {/* All Variants */}
            {variants.map((variant, variantIndex) => (
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