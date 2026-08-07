import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Textarea — Nocturne Design System
 *
 * Variantes:
 * - default: borda gradiente elevated
 * - flat: borda simples
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "flat"
}

export function Textarea({
  className,
  variant = "default",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        // Base
        "w-full min-h-[120px] px-3 py-3",
        "text-[14px] text-foreground font-normal",
        "caret-primary resize-none",
        "rounded-lg transition-all outline-none",
        // Placeholder
        "placeholder:text-neutral-600",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Variants
        variant === "default" && "input-elevated",
        variant === "flat" && [
          "bg-card border border-border",
          "hover:border-[color-mix(in_srgb,var(--color-text)_45%,transparent)]",
          "focus:border-primary",
        ],
        className
      )}
      {...props}
    />
  )
}
