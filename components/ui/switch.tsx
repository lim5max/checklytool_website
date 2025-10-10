"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Switch Component
 * Основан на дизайн-системе ChecklyTool
 * Использует стандартизованные размеры и стили
 */

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9 p-0.5",
        default: "h-6 w-11 p-0.5",
        lg: "h-7 w-[52px] p-0.5",
      },
      variant: {
        default: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-slate-300",
        blue: "data-[state=checked]:bg-primary-blue data-[state=unchecked]:bg-slate-300",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-white elevation-sm ring-0 transition-transform duration-200",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      }
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface SwitchProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

function Switch({ className, size, variant, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size, variant, className }))}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, switchVariants, type SwitchProps }
