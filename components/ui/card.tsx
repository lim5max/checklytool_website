import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Card Component
 * Основан на дизайн-системе ChecklyTool
 * Использует стандартизованные размеры, отступы и стили
 */

const cardVariants = cva(
  "flex flex-col bg-white border-2 font-inter transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-slate-200 elevation-sm",
        elevated: "border-slate-200 elevation-md hover:elevation-lg",
        interactive: "border-slate-200 elevation-sm hover:elevation-md hover:border-slate-300 cursor-pointer",
        outlined: "border-slate-200",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      rounded: {
        default: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      rounded: "default",
    },
  }
)

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

function Card({ className, variant, padding, rounded, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding, rounded, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-xl font-bold text-slate-900 font-nunito", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-slate-600 font-inter", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 mt-auto", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  type CardProps,
}
