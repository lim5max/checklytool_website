"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ActionButton {
  id: string
  label: string
  onClick: () => void
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost" | "link" | "toggle"
  disabled?: boolean
  loading?: boolean
  className?: string
}

interface StickyBottomActionsProps {
  // Single primary action (most common)
  primaryAction?: ActionButton
  
  // Multiple actions (for complex flows)
  actions?: ActionButton[]
  
  // Layout configuration
  layout?: "single" | "dual" | "multiple"
  
  // Custom styling
  className?: string
  contentClassName?: string
  
  // Safe area padding for devices with home indicators
  addSafeAreaPadding?: boolean
}

export default function StickyBottomActions({
  primaryAction,
  actions = [],
  layout = "single",
  className = "",
  contentClassName = "",
  addSafeAreaPadding = true
}: StickyBottomActionsProps) {
  // Determine which actions to render
  const allActions = primaryAction ? [primaryAction, ...actions] : actions
  
  // Auto-detect layout if not specified
  const finalLayout = layout === "single" && allActions.length > 1 
    ? (allActions.length === 2 ? "dual" : "multiple")
    : layout

  const renderAction = (action: ActionButton, index: number) => {
    const isLoading = action.loading
    
    return (
      <Button
        key={action.id}
        onClick={action.onClick}
        variant={action.variant || "default"}
        size="mobile"
        disabled={action.disabled || isLoading}
        className={cn(
          "h-14 rounded-figma-full font-inter font-medium text-[16px]",
          finalLayout === "single" && "w-full",
          finalLayout === "dual" && "flex-1",
          finalLayout === "multiple" && "flex-1",
          action.variant === "default" && "bg-primary-blue text-white",
          action.variant === "secondary" && "bg-slate-100 text-slate-800 hover:bg-slate-200",
          action.variant === "outline" && "border-slate-200 text-slate-700 hover:bg-slate-50",
          action.disabled && "opacity-50 cursor-not-allowed",
          action.className
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Загрузка...</span>
          </div>
        ) : (
          action.label
        )}
      </Button>
    )
  }

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl md:relative md:border-0 md:bg-transparent md:p-0",
        addSafeAreaPadding && "pb-safe-area",
        className
      )}
    >
      <div 
        className={cn(
          "p-[18px] md:p-0 flex items-center gap-3",
          finalLayout === "single" && "justify-center",
          finalLayout === "dual" && "justify-between",
          finalLayout === "multiple" && "justify-between flex-wrap",
          !addSafeAreaPadding && "pb-[18px]",
          addSafeAreaPadding && "pb-0 md:pb-4",
          contentClassName
        )}
      >
        {allActions.map((action, index) => renderAction(action, index))}
      </div>
    </div>
  )
}

// Convenience wrapper for single primary action (most common use case)
export function StickyPrimaryAction({
  label,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  variant = "default"
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  variant?: ActionButton["variant"]
}) {
  return (
    <StickyBottomActions
      primaryAction={{
        id: "primary",
        label,
        onClick,
        disabled,
        loading,
        variant,
        className
      }}
    />
  )
}

// Convenience wrapper for dual actions (primary + secondary)
export function StickyDualActions({
  primaryLabel,
  primaryOnClick,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  secondaryOnClick,
  secondaryDisabled = false,
  secondaryVariant = "secondary"
}: {
  primaryLabel: string
  primaryOnClick: () => void
  primaryDisabled?: boolean
  primaryLoading?: boolean
  secondaryLabel: string
  secondaryOnClick: () => void
  secondaryDisabled?: boolean
  secondaryVariant?: ActionButton["variant"]
}) {
  return (
    <StickyBottomActions
      layout="dual"
      actions={[
        {
          id: "secondary",
          label: secondaryLabel,
          onClick: secondaryOnClick,
          disabled: secondaryDisabled,
          variant: secondaryVariant
        },
        {
          id: "primary",
          label: primaryLabel,
          onClick: primaryOnClick,
          disabled: primaryDisabled,
          loading: primaryLoading,
          variant: "default"
        }
      ]}
    />
  )
}