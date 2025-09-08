"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTestHelperProps {
  children: React.ReactNode
  showBreakpoints?: boolean
  className?: string
}

// Standard device breakpoints for testing
const BREAKPOINTS = {
  mobile: { name: "Mobile", width: 375, height: 667 }, // iPhone SE
  mobileLarge: { name: "Mobile L", width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { name: "Tablet", width: 768, height: 1024 }, // iPad
  desktop: { name: "Desktop", width: 1024, height: 768 }, // Desktop
  desktopLarge: { name: "Desktop L", width: 1440, height: 900 } // Large Desktop
}

export default function ResponsiveTestHelper({ 
  children, 
  showBreakpoints = false,
  className = "" 
}: ResponsiveTestHelperProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("")
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setWindowSize({ width, height })
      
      // Determine current breakpoint
      if (width < 640) setCurrentBreakpoint("mobile")
      else if (width < 768) setCurrentBreakpoint("mobile-large")
      else if (width < 1024) setCurrentBreakpoint("tablet")
      else if (width < 1280) setCurrentBreakpoint("desktop")
      else setCurrentBreakpoint("desktop-large")
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  if (!showBreakpoints) {
    return <>{children}</>
  }

  return (
    <div className={cn("relative", className)}>
      {/* Breakpoint indicator */}
      <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-mono">
        <div>{currentBreakpoint}</div>
        <div className="text-xs opacity-70">
          {windowSize.width} × {windowSize.height}
        </div>
      </div>
      
      {/* Test buttons for different breakpoints */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {Object.entries(BREAKPOINTS).map(([key, bp]) => (
          <button
            key={key}
            onClick={() => {
              // Simulate viewport resize (for testing purposes)
              console.log(`Testing ${bp.name}: ${bp.width}×${bp.height}`)
            }}
            className="bg-primary-blue text-white px-3 py-1 rounded text-xs font-medium"
          >
            {bp.name}
          </button>
        ))}
      </div>
      
      {children}
    </div>
  )
}

// Hook for responsive testing
export function useResponsiveTest() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setIsDesktop(width >= 1024)
      
      if (width < 640) setCurrentBreakpoint("mobile")
      else if (width < 768) setCurrentBreakpoint("mobile-large")
      else if (width < 1024) setCurrentBreakpoint("tablet")
      else if (width < 1280) setCurrentBreakpoint("desktop")
      else setCurrentBreakpoint("desktop-large")
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0
  }
}

// Component spacing test utility
export function SpacingTestGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Grid overlay for spacing verification */}
      <div className="absolute inset-0 pointer-events-none opacity-10 z-10">
        <div 
          className="w-full h-full bg-red-500"
          style={{
            backgroundImage: `
              linear-gradient(to right, transparent 7px, red 8px, red 9px, transparent 10px),
              linear-gradient(to bottom, transparent 7px, red 8px, red 9px, transparent 10px)
            `,
            backgroundSize: '8px 8px'
          }}
        />
      </div>
      {children}
    </div>
  )
}

// Touch target test utility for mobile
export function TouchTargetTest({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Highlight elements that might be too small for touch */}
      <style jsx>{`
        .touch-target-test button,
        .touch-target-test a,
        .touch-target-test input,
        .touch-target-test [role="button"] {
          outline: 2px solid red !important;
          outline-offset: 2px;
        }
        
        .touch-target-test button[style*="height: 44px"],
        .touch-target-test button[style*="height: 48px"],
        .touch-target-test button.h-11,
        .touch-target-test button.h-12,
        .touch-target-test button.h-14 {
          outline-color: green !important;
        }
      `}</style>
      <div className="touch-target-test">
        {children}
      </div>
    </div>
  )
}