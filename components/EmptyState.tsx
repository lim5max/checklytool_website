"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { MobileCard } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/input"
// import { Plus, Search } from "lucide-react"
import MobileHeader from "@/components/MobileHeader"

interface EmptyStateProps {
  onCreateCheck?: () => void
}

export default function EmptyState({ onCreateCheck }: EmptyStateProps) {
  const handleCreateClick = () => {
    if (onCreateCheck) {
      onCreateCheck()
    } else {
      // Default navigation to mobile-first creation flow
      window.location.href = '/dashboard/checks/create'
    }
  }
  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Mobile Header */}
      <MobileHeader 
        variant="dashboard"
        showBackButton={false}
      />
      
      <div className="p-4 space-y-3">
        {/* Onboarding Card */}
        <MobileCard variant="onboarding" className="p-7">
          <div className="space-y-5">
            <h1 className="font-nunito font-black text-[28px] leading-[1.2] text-slate-800 max-w-[235px]">
              Начните с простых шагов
            </h1>
            
            <div className="flex gap-4">
              {/* Progress Timeline */}
              <div className="relative w-6 pt-[23px]">
                {/* Step 1 - Active */}
                <div className="absolute top-0 left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary-blue rounded-full"></div>
                </div>
                <div className="absolute top-[23px] left-2.5 w-1 h-9 bg-slate-200"></div>
                
                {/* Step 2 */}
                <div className="absolute top-11 left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                </div>
                <div className="absolute top-[59px] left-2.5 w-1 h-[39px] bg-slate-200"></div>
                
                {/* Step 3 */}
                <div className="absolute top-[88px] left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                </div>
                <div className="absolute top-[108px] left-2.5 w-1 h-[43px] bg-gradient-to-b from-slate-200 to-white"></div>
                
                {/* Completion Icon */}
                <div className="absolute top-[131px] left-[1.59px] w-[21px] h-[21px] bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 text-white">🎉</div>
                </div>
              </div>

              {/* Steps Content */}
              <div className="flex flex-col gap-[19px] text-[16px] leading-[1.5] max-w-[221px]">
                <div className="font-medium text-slate-800">
                  Создайте проверку
                </div>
                <div className="font-medium text-slate-800 text-center">
                  Загрузите работы учеников
                </div>
                <div className="font-medium text-slate-800">
                  Получите оценки
                </div>
                <div className="font-semibold text-green-500 tracking-[-0.32px]">
                  А потом можно отдыхать
                </div>
              </div>
            </div>
          </div>
        </MobileCard>

        {/* Create Check Button */}
        <Button 
          variant="default" 
          size="mobile" 
          className="w-full h-28 rounded-figma-full bg-primary-blue text-white text-[18px] font-medium"
          onClick={handleCreateClick}
        >
          Создать проверку
        </Button>
      </div>

      {/* Previous Works Section */}
      <div className="mt-8 space-y-[18px]">
        <div className="space-y-3">
          <h2 className="font-nunito font-black text-[24px] leading-[1.2] text-slate-800">
            Прошлые работы
          </h2>
          
          {/* Search Input */}
          <div className="relative">
            <SearchInput 
              placeholder="Поиск работ"
              className="w-full h-14"
            />
          </div>
        </div>

        {/* Empty State Message */}
        <div className="text-center">
          <p className="font-medium text-[16px] leading-[1.6] text-slate-500">
            Тут пока пусто
          </p>
        </div>
      </div>
    </div>
  )
}