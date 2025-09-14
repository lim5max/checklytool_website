"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import CheckCreationStep1 from "@/components/CheckCreationStep1"
import CheckCreationStep2 from "@/components/CheckCreationStep2"
import { toast } from "sonner"
import {
  type CheckCreationData,
  type WorkType,
  type GradingCriteria,
  type EssayGradingCriteria,
  type Answer,
  type VariantData,
  validateStep1,
  validateStep2,
  validateCheckCreationData,
  validateAPIResponse,
  mapUIDataToAPI,
  DEFAULT_GRADING_CRITERIA,
  DEFAULT_ESSAY_GRADING_CRITERIA,
  DEFAULT_ANSWERS,
  DEFAULT_ESSAY_PROMPT
} from "@/lib/check-creation-validation"

export default function CheckCreationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form data state
  const [checkData, setCheckData] = useState<CheckCreationData>({
    workTitle: "",
    workType: null,
    gradingCriteria: DEFAULT_GRADING_CRITERIA,
    essayGradingCriteria: DEFAULT_ESSAY_GRADING_CRITERIA,
    checkingMethod: "manual",
    answers: DEFAULT_ANSWERS,
    variants: undefined, // Will be set by CheckCreationStep2
    customPrompt: DEFAULT_ESSAY_PROMPT
  })
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  // Step 1 handlers
  const handleStep1Continue = () => {
    const step1Data = {
      workTitle: checkData.workTitle,
      workType: checkData.workType
    }
    
    const validation = validateStep1(step1Data)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      const errorMessages = Object.values(validation.errors).flat()
      toast.error(errorMessages[0] || "Пожалуйста, исправьте ошибки")
      return
    }
    
    setValidationErrors({})
    setCurrentStep(2)
  }

  const handleStep1Back = () => {
    router.push("/dashboard")
  }

  const handleWorkTitleChange = (title: string) => {
    setCheckData(prev => ({ ...prev, workTitle: title }))
  }

  const handleWorkTypeSelect = (workType: WorkType) => {
    setCheckData(prev => {
      const newData = { ...prev, workType }
      
      // If selecting essay, set AI method by default and clear answers
      if (workType.id === 'essay') {
        newData.checkingMethod = 'ai'
        newData.answers = []
      } else {
        // For tests, ensure we have default answers for manual checking
        newData.answers = prev.answers.length === 0 ? DEFAULT_ANSWERS : prev.answers
      }
      
      return newData
    })
  }

  // Step 2 handlers
  const handleStep2Continue = async () => {
    // Validate step 2 data
    const step2Data = {
      gradingCriteria: checkData.gradingCriteria,
      checkingMethod: checkData.checkingMethod,
      answers: checkData.answers
    }
    
    const step2Validation = validateStep2(step2Data)
    
    if (!step2Validation.isValid) {
      setValidationErrors(step2Validation.errors)
      const errorMessages = Object.values(step2Validation.errors).flat()
      toast.error(errorMessages[0] || "Пожалуйста, исправьте ошибки")
      return
    }
    
    // Validate complete form data
    const fullValidation = validateCheckCreationData(checkData)
    
    if (!fullValidation.isValid) {
      setValidationErrors(fullValidation.errors)
      const errorMessages = Object.values(fullValidation.errors).flat()
      toast.error(errorMessages[0] || "Пожалуйста, исправьте ошибки")
      return
    }
    
    setValidationErrors({})
    setIsLoading(true)
    
    try {
      // Get variant count from variants data
      const variantCount = checkData.variants?.length || 1
      
      // Map our data to the API format using the validation service
      const apiData = mapUIDataToAPI(checkData, variantCount)
      
      // Add variant data if available
      const requestBody = {
        ...apiData,
        variantData: checkData.variants?.map((variant, index) => ({
          variantNumber: index + 1,
          name: variant.name,
          answers: variant.answers
        }))
      }

      console.log('[UI] Sending API request with data:', requestBody)
      
      const response = await fetch('/api/checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[UI] API error response:', error)
        throw new Error(error.error || 'Не удалось создать проверочную работу')
      }

      const result = await response.json()
      console.log('[UI] API success response:', result)
      
      // Validate API response format
      const responseValidation = validateAPIResponse(result)
      
      if (!responseValidation.isValid) {
        console.error('[UI] Invalid API response format:', result)
        throw new Error(responseValidation.error || 'Неожиданный формат ответа')
      }
      
      toast.success('Проверочная работа создана успешно!')
      
      // Navigate to check management based on checking method
      const checkId = responseValidation.data!.check.id
      
      if (checkData.checkingMethod === "manual") {
        router.push(`/dashboard/checks/${checkId}?tab=variants`)
      } else {
        router.push(`/dashboard/checks/${checkId}`)
      }
      
    } catch (error) {
      console.error('[UI] Error creating check:', error)
      
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Произошла неожиданная ошибка')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  const handleGradingCriteriaChange = (criteria: GradingCriteria) => {
    setCheckData(prev => ({ ...prev, gradingCriteria: criteria }))
  }

  const handleEssayGradingCriteriaChange = (criteria: EssayGradingCriteria) => {
    setCheckData(prev => ({ ...prev, essayGradingCriteria: criteria }))
  }

  const handleCheckingMethodChange = (method: "manual" | "ai") => {
    setCheckData(prev => ({ ...prev, checkingMethod: method }))
  }

  const handleAnswersChange = (answers: Answer[]) => {
    setCheckData(prev => ({ ...prev, answers }))
  }

  const handleCustomPromptChange = (prompt: string) => {
    setCheckData(prev => ({ ...prev, customPrompt: prompt }))
  }

  const handleVariantsChange = (variants: VariantData[]) => {
    setCheckData(prev => ({ ...prev, variants }))
  }

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CheckCreationStep1
            workTitle={checkData.workTitle}
            selectedWorkType={checkData.workType}
            onWorkTitleChange={handleWorkTitleChange}
            onWorkTypeSelect={handleWorkTypeSelect}
            onContinue={handleStep1Continue}
            onBack={handleStep1Back}
            validationErrors={validationErrors}
          />
        )
      
      case 2:
        return (
          <CheckCreationStep2
            workType={checkData.workType}
            gradingCriteria={checkData.gradingCriteria}
            onGradingCriteriaChange={handleGradingCriteriaChange}
            essayGradingCriteria={checkData.essayGradingCriteria}
            onEssayGradingCriteriaChange={handleEssayGradingCriteriaChange}
            checkingMethod={checkData.checkingMethod}
            onCheckingMethodChange={handleCheckingMethodChange}
            answers={checkData.answers}
            onAnswersChange={handleAnswersChange}
            variants={checkData.variants}
            onVariantsChange={handleVariantsChange}
            customPrompt={checkData.customPrompt}
            onCustomPromptChange={handleCustomPromptChange}
            onContinue={handleStep2Continue}
            onBack={handleStep2Back}
            validationErrors={validationErrors}
            isLoading={isLoading}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <>
      {renderCurrentStep()}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
            <span className="font-inter font-medium text-slate-800">
              Создаем проверочную работу...
            </span>
          </div>
        </div>
      )}
    </>
  )
}