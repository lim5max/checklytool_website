import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] font-inter",
  {
    variants: {
      variant: {
        default:
          "bg-primary-blue text-white shadow-sm hover:bg-primary-blue/90 rounded-figma-full px-6 py-3 h-14 font-medium",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 rounded-figma-full px-6 py-3 h-14 font-medium",
        outline:
          "border border-slate-100 bg-background shadow-sm hover:bg-slate-50 hover:text-slate-800 rounded-figma-lg px-5 py-3 h-14 font-medium text-slate-500",
        secondary:
          "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200 rounded-figma-lg px-5 py-3 h-12 font-medium",
        ghost:
          "hover:bg-slate-50 hover:text-slate-800 rounded-figma-lg px-4 py-2 h-12 font-medium text-slate-600",
        link: "text-primary-blue underline-offset-4 hover:underline font-medium",
        toggle:
          "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-primary-blue hover:text-white rounded-figma-lg px-5 py-2 h-12 font-medium data-[state=active]:bg-primary-blue data-[state=active]:text-white",
      },
      size: {
        default: "h-14 px-6 py-3",
        sm: "h-12 px-5 py-2",
        lg: "h-16 px-8 py-4",
        icon: "size-12",
        mobile: "h-14 px-6 py-3 w-full", // Full width for mobile
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
