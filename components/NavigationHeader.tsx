"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'

interface NavigationHeaderProps {
  title?: string
  showBackButton?: boolean
  showCloseButton?: boolean
  onBack?: () => void
  onClose?: () => void
  className?: string
}

export default function NavigationHeader({
  title,
  showBackButton = false,
  showCloseButton = false,
  onBack,
  onClose,
  className = ""
}: NavigationHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      // При нажатии на крестик попадаем на главную
      router.push('/dashboard')
    }
  }

  return (
    <div className={`flex items-center justify-between p-4 ${className}`}>
      {/* Левая сторона - кнопка назад */}
      <div className="w-8 h-8 flex items-center justify-center">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
        )}
      </div>

      {/* Центр - заголовок */}
      {title && (
        <div className="flex-1 text-center px-4">
          <h1 className="font-nunito font-black text-[28px] leading-[1.2] text-slate-800 truncate">
            {title}
          </h1>
        </div>
      )}

      {/* Правая сторона - кнопка закрыть (крестик) для возврата на главную */}
      <div className="w-8 h-8 flex items-center justify-center">
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Закрыть и вернуться на главную"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        )}
      </div>
    </div>
  )
}