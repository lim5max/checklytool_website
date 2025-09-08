"use client"

import React, { useState, useEffect } from "react"
import CheckCreationStep1 from "@/components/CheckCreationStep1"
import CheckCreationStep2 from "@/components/CheckCreationStep2"
import { 
  type CheckCreationData,
  type WorkType,
  DEFAULT_GRADING_CRITERIA,
  DEFAULT_ANSWERS
} from "@/lib/check-creation-validation"

export default function ResponsiveTestPage() {
  const [screenWidth, setScreenWidth] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [checkData, setCheckData] = useState<CheckCreationData>({
    workTitle: "Test Responsive Layout",
    workType: null,
    gradingCriteria: DEFAULT_GRADING_CRITERIA,
    checkingMethod: "manual",
    answers: DEFAULT_ANSWERS
  })

  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth)
    }
    
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  const getBreakpointName = (width: number): string => {
    if (width < 640) return "Mobile (< 640px)"
    if (width < 768) return "SM (640px - 768px)"
    if (width < 1024) return "MD (768px - 1024px)"
    if (width < 1280) return "LG (1024px - 1280px)"
    if (width < 1536) return "XL (1280px - 1536px)"
    return "2XL (> 1536px)"
  }

  const handleWorkTitleChange = (title: string) => {
    setCheckData(prev => ({ ...prev, workTitle: title }))
  }

  const handleWorkTypeSelect = (workType: WorkType) => {
    setCheckData(prev => ({ ...prev, workType }))
  }

  const handleGradingCriteriaChange = (criteria: any) => {
    setCheckData(prev => ({ ...prev, gradingCriteria: criteria }))
  }

  const handleCheckingMethodChange = (method: "manual" | "ai") => {
    setCheckData(prev => ({ ...prev, checkingMethod: method }))
  }

  const handleAnswersChange = (answers: any) => {
    setCheckData(prev => ({ ...prev, answers }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Indicator */}
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 font-mono text-sm">
        Current: {getBreakpointName(screenWidth)} | Width: {screenWidth}px
      </div>
      
      {/* Breakpoint Visualization */}
      <div className="fixed top-12 left-0 right-0 bg-blue-600 text-white text-center py-1 z-50 font-mono text-xs">
        <div className="flex justify-center space-x-4">
          <span className={`px-2 py-1 rounded ${screenWidth < 640 ? 'bg-yellow-500' : 'bg-blue-700'}`}>
            Mobile (&lt;640px)
          </span>
          <span className={`px-2 py-1 rounded ${screenWidth >= 640 && screenWidth < 768 ? 'bg-yellow-500' : 'bg-blue-700'}`}>
            SM (640-768px)
          </span>
          <span className={`px-2 py-1 rounded ${screenWidth >= 768 && screenWidth < 1024 ? 'bg-yellow-500' : 'bg-blue-700'}`}>
            MD (768-1024px)
          </span>
          <span className={`px-2 py-1 rounded ${screenWidth >= 1024 && screenWidth < 1280 ? 'bg-yellow-500' : 'bg-blue-700'}`}>
            LG (1024-1280px)
          </span>
          <span className={`px-2 py-1 rounded ${screenWidth >= 1280 ? 'bg-yellow-500' : 'bg-blue-700'}`}>
            XL+ (≥1280px)
          </span>
        </div>
      </div>

      {/* Test Controls */}
      <div className="fixed top-20 left-0 right-0 bg-green-600 text-white text-center py-2 z-50">
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setCurrentStep(1)}
            className={`px-4 py-1 rounded ${currentStep === 1 ? 'bg-yellow-500' : 'bg-green-700'}`}
          >
            Step 1
          </button>
          <button 
            onClick={() => setCurrentStep(2)}
            className={`px-4 py-1 rounded ${currentStep === 2 ? 'bg-yellow-500' : 'bg-green-700'}`}
          >
            Step 2
          </button>
        </div>
      </div>

      {/* Main Content Area with top margin to account for fixed headers */}
      <div className="pt-32">
        {currentStep === 1 ? (
          <CheckCreationStep1
            workTitle={checkData.workTitle}
            selectedWorkType={checkData.workType}
            onWorkTitleChange={handleWorkTitleChange}
            onWorkTypeSelect={handleWorkTypeSelect}
            onContinue={() => setCurrentStep(2)}
            onBack={() => console.log('Back clicked')}
            validationErrors={{}}
          />
        ) : (
          <CheckCreationStep2
            gradingCriteria={checkData.gradingCriteria}
            onGradingCriteriaChange={handleGradingCriteriaChange}
            checkingMethod={checkData.checkingMethod}
            onCheckingMethodChange={handleCheckingMethodChange}
            answers={checkData.answers}
            onAnswersChange={handleAnswersChange}
            onContinue={() => console.log('Continue clicked')}
            onBack={() => setCurrentStep(1)}
            validationErrors={{}}
            isLoading={false}
          />
        )}
      </div>

      {/* Layout Information */}
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm font-mono z-40">
        <div>Current Step: {currentStep}</div>
        <div>Breakpoint: {getBreakpointName(screenWidth)}</div>
        <div>Screen: {screenWidth}px</div>
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-300">Test Features:</div>
          <div className="text-xs">• Mobile-first design ✓</div>
          <div className="text-xs">• Responsive containers ✓</div>
          <div className="text-xs">• Sticky bottom actions ✓</div>
          <div className="text-xs">• Safe area padding ✓</div>
        </div>
      </div>
    </div>
  )
}
