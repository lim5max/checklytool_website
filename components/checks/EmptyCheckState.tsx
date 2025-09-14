'use client'

import Image from 'next/image'
import { ArrowLeft, Settings, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface EmptyCheckStateProps {
  className?: string
  title?: string
  checkId?: string
  onOpenCamera?: () => void
}

export function EmptyCheckState({ className = '', title = 'Контрольная по информатике', checkId, onOpenCamera }: EmptyCheckStateProps) {
  const router = useRouter()
  
  const handleClose = () => {
    // При нажатии на крестик попадаем на главную
    router.push('/dashboard')
  }
  
  const handleSettings = () => {
    // TODO: Implement settings navigation
    console.log('Settings clicked')
  }
  
  const handleUpload = () => {
    if (checkId && onOpenCamera) {
      onOpenCamera()
    } else {
      console.log('No checkId or onOpenCamera provided')
    }
  }
  

  return (
    <div className={`min-h-screen bg-white px-4 py-6 ${className}`}>
      <div className="max-w-md mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleClose}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-slate-800" />
          </button>
          
          <button
            onClick={handleSettings}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-6 h-6 text-slate-800" />
          </button>
        </div>
        
        {/* Title */}
        <h1 className="text-[28px] font-black leading-[1.2] text-slate-800 mb-8">
          {title}
        </h1>
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2.5">
          {/* Illustration */}
          <div className="h-[235px] w-full overflow-hidden relative mb-4">
            <div className="absolute bg-center bg-no-repeat bg-cover size-[219px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Image
                src="/images/empty-work-illustration.png"
                alt="Пустой список"
                width={219}
                height={219}
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Message */}
          <div className="font-medium text-center text-slate-500 text-base w-[191px] leading-[1.6]">
            <p>Список проверенных работ пуст</p>
          </div>
        </div>
        
        {/* Fixed Upload Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-[18px] py-0 h-[82px] flex items-center justify-center">
          <button
            onClick={handleUpload}
            className="w-full h-14 bg-[#096ff5] rounded-[180px] flex items-center justify-center px-[43px]">
            <span className="font-medium text-white text-[16px] leading-[1.6]">
              Загрузить работы
            </span>
          </button>
        </div>
      </div>
      
    </div>
  )
}