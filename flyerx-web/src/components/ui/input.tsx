import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Input — Nocturne Design System
 *
 * Variantes:
 * - default: borda gradiente elevated
 * - flat: borda simples (estilo antigo)
 */
export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "flat"
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full min-h-10 px-3 py-2",
        "text-[14px] text-foreground font-normal",
        "caret-primary",
        "rounded-lg transition-all outline-none",
        // Placeholder
        "placeholder:text-neutral-600",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive",
        // File input
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent",
        "file:text-sm file:font-medium file:text-foreground",
        // Variants
        variant === "default" && "input-elevated",
        variant === "flat" && [
          "bg-card border border-border",
          "hover:border-[color-mix(in_srgb,var(--color-text)_45%,transparent)]",
          "focus-visible:border-primary",
        ],
        className
      )}
      {...props}
    />
  )
}

export { Input }
