"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface DesktopHeaderProps {
  variant?: "landing" | "about" | "dashboard"
  className?: string
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onSignOut?: () => void
}

export default function DesktopHeader({
  variant = "landing",
  className = "",
  user,
  onSignOut
}: DesktopHeaderProps) {
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
              <Link 
                href="/dashboard/checks" 
                className="font-inter font-medium text-base transition-colors hover:text-primary-blue text-slate-600"
              >
                Работы
              </Link>
              <Link 
                href="/dashboard/profile" 
                className="font-inter font-medium text-base transition-colors hover:text-primary-blue text-slate-600"
              >
                Профиль
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
      {variant === "dashboard" && user ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                {user.name || user.email}
              </p>
            </div>
          </div>
          {onSignOut && (
            <Button
              onClick={onSignOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          )}
        </div>
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