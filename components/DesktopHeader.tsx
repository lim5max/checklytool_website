"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, ChevronDown, User } from "lucide-react"

interface DesktopHeaderProps {
  variant?: "landing" | "about" | "dashboard"
  className?: string
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onSignOut?: () => void
  isUserLoading?: boolean
}

export default function DesktopHeader({
  variant = "landing",
  className = "",
  user,
  onSignOut,
  isUserLoading = false
}: DesktopHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  return (
    <header className={`hidden md:flex items-center justify-between w-full ${className}`}>
      {/* Logo and Navigation */}
      <div className="flex items-center gap-8">
        <Link href={variant === "dashboard" ? "/dashboard" : "/"} className="flex items-center">
          <Image 
            src="/images/logo.png" 
            alt="ChecklyTool" 
            width={120} 
            height={40}
            priority
            className="object-contain"
          />
        </Link>
        <nav className="flex items-center gap-6">
          {variant === "dashboard" ? (
            <>
              <Link
                href="/dashboard"
                className="font-inter font-medium text-base transition-colors hover:text-primary-blue text-slate-900"
              >
                Главная
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/about" 
                className={`font-inter font-medium text-base transition-colors hover:text-primary-blue ${
                  variant === "about" ? "text-slate-900" : "text-slate-600"
                }`}
              >
                О проекте
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Right side */}
      {variant === "dashboard" ? (
        isUserLoading ? (
          // Скелетон профиля во время загрузки
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
          </div>
        ) : user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-slate-50 rounded-full p-2 transition-colors"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-xs">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Профиль
                  </Link>
                  {onSignOut && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false)
                        onSignOut()
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // В dashboard варианте показываем скелетон если данные не загружены
          isUserLoading ? (
            <div className="flex items-center gap-2 p-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ) : null
        )
      ) : (
        <Link 
          href="/auth/login"
          className="bg-primary-blue hover:bg-blue-600 transition-colors text-white font-inter font-medium text-base px-6 py-3 rounded-full"
        >
          Войти
        </Link>
      )}
    </header>
  )
}