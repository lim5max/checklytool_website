'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'
import { Menu, X } from 'lucide-react'
import type { Session } from 'next-auth'

interface DashboardNavbarProps {
  session: Session
}

export default function DashboardNavbar({ session }: DashboardNavbarProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const user = session.user

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <Image 
              src="/images/logo.png" 
              alt="ChecklyTool" 
              width={120} 
              height={40}
              className="object-contain"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Главная
            </Link>
            <Link 
              href="/dashboard/assignments" 
              className="text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Работы
            </Link>
            <Link 
              href="/dashboard/profile" 
              className="text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Профиль
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-slate-900">
                {user?.name || user?.email}
              </span>
              <span className="text-xs text-slate-500">
                {user?.email}
              </span>
            </div>

            <div className="relative">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isLoading}
              className="hidden md:flex"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                'Выйти'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Главная
            </Link>
            <Link 
              href="/dashboard/checks" 
              className="block px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Работы
            </Link>
            <Link 
              href="/dashboard/profile" 
              className="block px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Профиль
            </Link>
            
            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="px-3 py-2 text-sm text-slate-600">
                {user?.name || user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading}
                className="mx-3 w-full justify-center"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                  'Выйти'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}