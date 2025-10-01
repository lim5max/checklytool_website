import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Input Component
 * Основан на дизайн-системе ChecklyTool
 * Использует стандартизованные размеры, отступы и стили
 */

const inputVariants = cva(
  "flex w-full border-2 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue disabled:cursor-not-allowed disabled:opacity-50 font-inter transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-slate-200 hover:border-slate-300",
        filled: "bg-slate-50 border-slate-200 hover:border-slate-300",
        error: "border-red-300 focus-visible:ring-red-500 focus-visible:border-red-500",
      },
      size: {
        sm: "h-10 px-3 text-sm rounded-lg",
        default: "h-12 px-4 text-base rounded-xl",
        lg: "h-14 px-5 text-base rounded-xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type InputProps = React.ComponentProps<"input"> & VariantProps<typeof inputVariants>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

/**
 * SearchInput Component
 * Input с иконкой поиска слева
 */
type SearchInputProps = Omit<InputProps, 'type'>

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          type="text"
          className={cn("pl-11", className)}
          ref={ref}
          {...props}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="21 21l-4.35-4.35"/>
          </svg>
        </div>
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, SearchInput, inputVariants }
export type { InputProps, SearchInputProps }
