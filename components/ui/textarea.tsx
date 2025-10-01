import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Textarea Component
 * Основан на дизайн-системе ChecklyTool
 * Использует стандартизованные размеры, отступы и стили
 */

const textareaVariants = cva(
  "flex w-full border-2 text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue disabled:cursor-not-allowed disabled:opacity-50 font-inter transition-all duration-200 resize-y",
  {
    variants: {
      variant: {
        default: "bg-slate-50 border-slate-200 hover:border-slate-300 focus-visible:bg-white",
        outlined: "bg-white border-slate-200 hover:border-slate-300",
        error: "bg-red-50 border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500",
      },
      size: {
        sm: "min-h-20 px-3 py-2 text-sm rounded-lg",
        default: "min-h-24 px-4 py-3 text-base rounded-xl",
        lg: "min-h-32 px-5 py-4 text-base rounded-xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface TextareaProps extends React.ComponentProps<"textarea">, VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(textareaVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants, type TextareaProps }
