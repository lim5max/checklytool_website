"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { 
  type WorkType, 
  WORK_TYPES,
  getFieldErrorMessage,
  hasFieldError
} from "@/lib/check-creation-validation"
import { cn } from "@/lib/utils"

interface CheckCreationStep1Props {
  workTitle?: string
  selectedWorkType?: WorkType | null
  onWorkTitleChange?: (title: string) => void
  onWorkTypeSelect?: (workType: WorkType) => void
  onContinue?: () => void
  onBack?: () => void
  validationErrors?: Record<string, string[]>
}

export default function CheckCreationStep1({
  workTitle = "",
  selectedWorkType = null,
  onWorkTitleChange,
  onWorkTypeSelect,
  onContinue,
  onBack,
  validationErrors = {}
}: CheckCreationStep1Props) {
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string | null>(
    selectedWorkType?.id || "test" // По умолчанию выбираем "test"
  )

  const workTypes = WORK_TYPES

  const handleWorkTypeSelect = (workType: WorkType) => {
    setSelectedWorkTypeId(workType.id)
    onWorkTypeSelect?.(workType)
  }

  // При монтировании автоматически выбираем "test" если ничего не выбрано
  React.useEffect(() => {
    if (!selectedWorkType && workTypes.length > 0) {
      const testWorkType = workTypes.find(wt => wt.id === 'test')
      if (testWorkType) {
        handleWorkTypeSelect(testWorkType)
      }
    }
  }, [])

  const handleContinue = () => {
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
          
          {/* Work Title Section */}
          <div className="flex flex-col gap-3 items-start justify-start relative shrink-0 w-full">
            <div className="flex gap-2.5 items-center justify-start relative shrink-0 w-full">
              <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                <p className="leading-[1.2] whitespace-pre">Название работы</p>
              </div>
            </div>
            
            <div className="bg-slate-50 h-14 relative rounded-[27px] shrink-0 w-full">
              <div className="box-border flex flex-col gap-2.5 h-14 items-start justify-center overflow-clip px-[21px] py-[11px] relative w-full">
                <div className="flex gap-2 items-center justify-start relative shrink-0 w-full">
                  <Input
                    value={workTitle}
                    onChange={(e) => onWorkTitleChange?.(e.target.value)}
                    placeholder="Контрольная по информатике"
                    className={cn(
                      "font-inter font-medium leading-[0] text-[16px] text-slate-500 border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-slate-500",
                      hasFieldError(validationErrors, 'workTitle') && "text-red-500"
                    )}
                  />
                </div>
              </div>
              <div className="absolute border border-slate-100 border-solid inset-0 pointer-events-none rounded-[27px]" />
            </div>
            
            {/* Error message */}
            {hasFieldError(validationErrors, 'workTitle') && (
              <p className="text-red-500 text-sm font-inter">
                {getFieldErrorMessage(validationErrors, 'workTitle')}
              </p>
            )}
          </div>

          {/* Work Type Section */}
          <div className="flex flex-col gap-3 items-start justify-start relative shrink-0 w-full">
            <div className="flex gap-2.5 items-center justify-start relative shrink-0 w-full">
              <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                <p className="leading-[1.2] whitespace-pre">Тип работы</p>
              </div>
            </div>
            
            {/* Work Type Grid matching Figma exactly - только 2 элемента в строку */}
            <div className="gap-2 grid grid-cols-2 grid-rows-1 h-40 relative shrink-0 w-full">
              {workTypes.map((workType, index) => (
                <button
                  key={workType.id}
                  onClick={() => handleWorkTypeSelect(workType)}
                  className={cn(
                    "h-40 overflow-clip relative rounded-[28px] shrink-0",
                    selectedWorkTypeId === workType.id 
                      ? "bg-[#096ff5]" 
                      : "bg-slate-100",
                    hasFieldError(validationErrors, 'workType') && "ring-2 ring-red-500",
                    index === 0 ? "[grid-area:1_/_1]" : "[grid-area:1_/_2]"
                  )}
                >
                  <div className={cn(
                    "absolute flex flex-col font-inter font-medium justify-center leading-[0] text-[16px] top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]",
                    selectedWorkTypeId === workType.id ? "text-white" : "text-slate-800",
                    index === 0 ? "w-[107px]" : "w-[88px]"
                  )}>
                    <p className="leading-[1.6] text-center">{workType.title}</p>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Error message */}
            {hasFieldError(validationErrors, 'workType') && (
              <p className="text-red-500 text-sm font-inter text-center">
                {getFieldErrorMessage(validationErrors, 'workType')}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Sticky Bottom Button matching Figma exactly - обычная кнопка в блоке */}
      <div className="fixed bg-white bottom-0 box-border flex flex-col gap-2.5 h-[82px] items-center justify-center left-0 px-[18px] py-0 right-0 z-50">
        <div className="absolute border-t border-slate-200 border-solid inset-0 pointer-events-none" />
        <button
          onClick={handleContinue}
          disabled={!workTitle.trim() || !selectedWorkTypeId}
          className="bg-[#096ff5] box-border flex gap-2.5 h-14 items-center justify-center overflow-clip px-[43px] py-4 relative rounded-[180px] shrink-0 w-full disabled:opacity-50"
        >
          <div className="flex flex-col font-inter font-medium justify-center leading-[0] text-[16px] text-nowrap text-white">
            <p className="leading-[1.6] whitespace-pre">Продолжить настройку</p>
          </div>
        </button>
      </div>
    </div>
  )
}