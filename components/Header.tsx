"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowLeft, User, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  // Header configuration
  variant?: "landing" | "dashboard" | "app" | "about"
  showBackButton?: boolean
  backButtonHref?: string
  onBackClick?: () => void

  // User information for dashboard
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null

  // Callbacks
  onOpenModal?: () => void
  isUserLoading?: boolean

  // Custom styling
  className?: string
}

export default function Header({
  variant = "landing",
  showBackButton = false,
  onBackClick,
  user,
  isUserLoading = false,
  className = ""
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)
  const handleBackClick = onBackClick || (() => {})

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      // Call our API route to sign out
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok || response.redirected) {
        // Force a hard redirect to clear all state
        window.location.href = '/'
      } else {
        console.error('Sign out failed')
        setIsSigningOut(false)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  return (
    <>
      {/* Mobile Header */}
      <header className={`md:hidden flex items-center justify-between w-full ${className}`}>
        {/* Left side - Logo and Back Button */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link href={variant === "dashboard" ? "/dashboard" : "/"} className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="ChecklyTool"
              width={125}
              height={30}
              priority
            />
          </Link>
        </div>

        {/* Right side - Menu/User */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={toggleMenu}
            className="p-2 w-12 h-12 flex items-center justify-center"
          >
            <Menu className="h-8 w-8" />
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={closeMenu}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full bg-white shadow-2xl z-50 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8 h-[38px]">
                  <div className="flex items-center h-full">
                    <Image
                      src="/images/logo.png"
                      alt="ChecklyTool"
                      width={125}
                      height={30}
                      priority
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={closeMenu}
                    className="p-2 w-10 h-10 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    <X className="h-6 w-6 flex-shrink-0" />
                  </Button>
                </div>

                <div className="flex flex-col flex-1">
                  <nav className="flex-1 space-y-8">
                    {variant === "dashboard" && user ? (
                      <>
                        <div className="border-b pb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || 'User'}
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                  sizes="48px"
                                />
                              ) : (
                                <User className="h-6 w-6 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-nunito font-bold text-xl text-gray-900">{user.name || 'Пользователь'}</p>
                              <p className="text-base text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <Link
                            href="/dashboard"
                            className="block text-xl font-nunito font-bold text-gray-700 hover:text-gray-900 transition-colors"
                            onClick={closeMenu}
                          >
                            Дашборд
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-6">
                        <Link
                          href="/"
                          className="block text-xl font-nunito font-bold text-gray-700 hover:text-gray-900 transition-colors"
                          onClick={closeMenu}
                        >
                          Главная
                        </Link>
                        <Link
                          href="/about"
                          className="block text-xl font-nunito font-bold text-gray-700 hover:text-gray-900 transition-colors"
                          onClick={closeMenu}
                        >
                          О проекте
                        </Link>
                        <Link
                          href="/auth/login"
                          className="block text-xl font-nunito font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={closeMenu}
                        >
                          Войти
                        </Link>
                      </div>
                    )}
                  </nav>

                  {/* Кнопка выйти в самом низу для dashboard */}
                  {variant === "dashboard" && user && (
                    <div className="mt-auto pt-6 border-t">
                      <button
                        onClick={() => {
                          handleSignOut()
                          closeMenu()
                        }}
                        disabled={isSigningOut}
                        className="flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors w-full text-left disabled:opacity-50"
                      >
                        {isSigningOut ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <LogOut className="h-5 w-5" />
                        )}
                        <span className="text-xl font-nunito font-bold">
                          {isSigningOut ? 'Выходим...' : 'Выйти'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Desktop Header */}
      <header className={`hidden md:flex items-center justify-between w-full ${className}`}>
        {/* Logo and Navigation */}
        <div className="flex items-center gap-8">
          <Link href={variant === "dashboard" ? "/dashboard" : "/"} className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="ChecklyTool"
              width={125}
              height={30}
              priority
            />
          </Link>

          {/* Navigation Links for Landing/About */}
          {(variant === "landing" || variant === "about") && (
            <nav className="hidden lg:flex items-center space-x-6">
              <Link
                href="/"
                className="text-slate-700 hover:text-slate-900 transition-colors font-medium"
              >
                Главная
              </Link>
              <Link
                href="/about"
                className="text-slate-700 hover:text-slate-900 transition-colors font-medium"
              >
                О проекте
              </Link>
            </nav>
          )}
        </div>

        {/* Right side - Auth/User */}
        <div className="flex items-center space-x-4">
          {variant === "dashboard" ? (
            // Dashboard user menu or loading state
            <div className="relative" ref={dropdownRef}>
              {isUserLoading ? (
                <div className="flex items-center gap-2 p-2">
                  <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                  <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ) : user ? (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                        sizes="32px"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
              ) : null}

              {isProfileOpen && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border-2 border-slate-200 elevation-lg py-2 z-50">
                  <div className="px-4 py-3 border-b-2 border-slate-100">
                    <p className="text-base font-semibold text-slate-900">{user.name || 'Пользователь'}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{user.email}</p>
                  </div>

                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg mx-2 my-1 disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="icon-sm" />
                    )}
                    <span>{isSigningOut ? 'Выходим...' : 'Выйти'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Landing/About login button
            <Link href="/auth/login">
              <Button variant="default" size="sm">
                Войти
              </Button>
            </Link>
          )}
        </div>
      </header>
    </>
  )
}