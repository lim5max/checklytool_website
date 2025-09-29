import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-figma-lg border border-slate-100 bg-slate-50 px-[21px] py-[11px] text-base font-medium text-slate-800 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue disabled:cursor-not-allowed disabled:opacity-50 font-inter transition-all resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
