import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-14 w-full rounded-figma-lg border border-slate-100 bg-slate-50 px-[21px] py-[11px] text-base font-medium text-slate-800 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue disabled:cursor-not-allowed disabled:opacity-50 font-inter transition-all",
        className
      )}
      {...props}
    />
  )
}

// Specialized input variants for the Figma design
const SearchInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>((
  { className, ...props },
  ref,
) => {
  return (
    <div className="relative">
      <input
        type="text"
        className={cn(
          "flex h-14 w-full rounded-figma-lg border border-slate-100 bg-slate-50 px-[21px] py-[11px] pl-12 text-base font-medium text-slate-800 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:border-primary-blue font-inter transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
      <div className="absolute left-[21px] top-1/2 -translate-y-1/2 text-slate-500">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="21 21l-4.35-4.35"/>
        </svg>
      </div>
    </div>
  )
})
SearchInput.displayName = "SearchInput"

export { Input, SearchInput }
