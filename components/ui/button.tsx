import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button Component
 * Основан на дизайн-системе ChecklyTool
 * Использует стандартизованные размеры, отступы и стили
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-inter shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-blue text-white elevation-sm hover:elevation-md hover:bg-primary-blue/90 active:elevation-none",
        destructive:
          "bg-red-500 text-white elevation-sm hover:elevation-md hover:bg-red-600 active:elevation-none",
        outline:
          "border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 active:bg-slate-100",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 text-slate-600 active:bg-slate-200",
        link:
          "text-primary-blue underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-10 px-4 text-sm rounded-lg",
        default: "h-12 px-6 text-base rounded-xl",
        lg: "h-14 px-8 text-base rounded-xl",
        icon: "size-12 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
