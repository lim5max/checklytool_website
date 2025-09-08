import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-figma-lg border border-slate-100 py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-3 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-slate-800 font-inter", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-slate-500 text-sm font-inter", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

// Mobile-first card variants for Figma designs
const MobileCard = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & {
  variant?: "default" | "onboarding" | "selection"
}>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-white border-slate-100 shadow-sm",
      onboarding: "bg-slate-50 border-slate-100 shadow-sm", 
      selection: "bg-white border-slate-100 hover:border-primary-blue hover:shadow-md transition-all cursor-pointer"
    }
    
    return (
      <div
        ref={ref}
        data-slot="mobile-card"
        className={cn(
          "flex flex-col gap-4 rounded-figma-lg border p-6 font-inter",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
MobileCard.displayName = "MobileCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  MobileCard,
}
