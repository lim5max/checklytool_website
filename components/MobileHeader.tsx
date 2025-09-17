"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowLeft, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
  // Header configuration
  variant?: "landing" | "dashboard" | "app"
  showBackButton?: boolean
  backButtonHref?: string
  onBackClick?: () => void
  
  // User information for dashboard
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  
  // Callbacks
  onSignOut?: () => void
  onOpenModal?: () => void
  
  // Custom styling
  className?: string
}

export default function MobileHeader({
  variant = "landing",
  showBackButton = false,
  backButtonHref,
  onBackClick,
  user,
  onSignOut,
  onOpenModal,
  className = ""
}: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    }
    closeMenu()
  }

  const renderLogo = () => (
    <div className="flex items-center">
      <Image 
        src="/images/logo.png" 
        alt="ChecklyTool" 
        width={120} 
        height={40}
        priority
        className="object-contain"
      />
    </div>
  )

  const renderLogoLink = () => {
    const logoHref = variant === "dashboard" ? "/dashboard" : "/"
    return (
      <Link href={logoHref} className="flex items-center gap-1">
        {renderLogo()}
      </Link>
    )
  }

  const renderMenuButton = () => {
    // Don't show menu button for app variant when back button is present
    if (variant === "app" && showBackButton) {
      return null
    }
    
    return (
      <button 
        onClick={toggleMenu}
        className="w-[42px] h-[42px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-slate-900" />
      </button>
    )
  }

  const renderLandingMenu = () => (
    <motion.div 
      className="fixed inset-0 bg-white z-50 md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/" onClick={closeMenu}>
              {renderLogo()}
            </Link>
            <button 
              onClick={closeMenu}
              className="w-[42px] h-[42px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-slate-900" />
            </button>
          </div>
          
          <motion.div 
            className="flex flex-col font-nunito font-black gap-2.5 text-[36px] text-slate-800 tracking-[-1px] px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Link href="/" onClick={closeMenu}>
                <p className="leading-[1.2]">Главная</p>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Link href="/about" onClick={closeMenu}>
                <p className="leading-[1.2]">О проекте</p>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div
          className="w-full px-4 pb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link 
            href="/auth/login"
            onClick={closeMenu}
            className="bg-primary-blue hover:bg-blue-600 transition-colors flex items-center justify-center h-14 px-5 py-3 rounded-full shadow-lg w-full"
          >
            <span className="font-inter font-medium text-white text-[16px]">
              Войти
            </span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )

  const renderDashboardMenu = () => (
    <motion.div 
      className="fixed inset-0 bg-white z-50 md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard" onClick={closeMenu}>
              {renderLogo()}
            </Link>
            <button 
              onClick={closeMenu}
              className="w-[42px] h-[42px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-slate-900" />
            </button>
          </div>
          
          <motion.div 
            className="flex flex-col font-nunito font-black gap-2.5 text-[36px] text-slate-800 tracking-[-1px] px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Link href="/dashboard" onClick={closeMenu}>
                <p className="leading-[1.2]">Главная</p>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Link href="/dashboard/checks" onClick={closeMenu}>
                <p className="leading-[1.2]">Работы</p>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Link href="/dashboard/profile" onClick={closeMenu}>
                <p className="leading-[1.2]">Профиль</p>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* User section */}
        {user && (
          <motion.div
            className="w-full flex flex-col gap-4 px-4 pb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex items-center gap-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-base">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-nunito font-bold text-lg text-slate-900 truncate">
                  {user.name || user.email}
                </p>
                {user.name && user.email && (
                  <p className="font-inter text-sm text-slate-500 truncate">{user.email}</p>
                )}
              </div>
            </div>
            {onSignOut && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={onSignOut}
                  variant="outline"
                  className="w-full justify-center gap-2 h-14 rounded-full font-inter font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Выйти
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )

  const renderAppMenu = () => (
    <motion.div 
      className="fixed inset-0 bg-white z-50 md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {renderLogo()}
          <button 
            onClick={closeMenu}
            className="w-[42px] h-[42px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-slate-900" />
          </button>
        </div>

        {/* Simple Navigation for App */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Вернуться к проверкам
            </Link>
          </nav>
        </div>
      </div>
    </motion.div>
  )

  return (
    <>
      <header className={`flex items-center justify-between md:hidden ${className}`}>
        {/* Left side - Back button or Logo */}
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button 
              onClick={handleBackClick}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-800 -ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          {!showBackButton && (variant === "dashboard" || variant === "landing") ? (
            renderLogoLink()
          ) : !showBackButton ? (
            renderLogo()
          ) : null}
        </div>

        {/* Right side - Menu button */}
        {renderMenuButton()}
      </header>

      {/* Full-screen menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {variant === "landing" && renderLandingMenu()}
            {variant === "dashboard" && renderDashboardMenu()}
            {variant === "app" && renderAppMenu()}
          </>
        )}
      </AnimatePresence>
    </>
  )
}