import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * SelectNative — Nocturne Design System
 *
 * Select nativo com estilo elevated.
 * Para selects mais complexos, use o Select do Radix.
 */
export interface SelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: "default" | "flat"
  placeholder?: string
}

export function SelectNative({
  className,
  variant = "default",
  children,
  ...props
}: SelectNativeProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          // Base
          "w-full h-10 px-3 pr-10 appearance-none",
          "text-[14px] text-foreground font-normal",
          "rounded-lg transition-all outline-none cursor-pointer",
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
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
    </div>
  )
}

/**
 * SelectOption — Option estilizada
 */
export function SelectOption({
  className,
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return (
    <option
      className={cn(
        "bg-surface text-foreground py-2",
        className
      )}
      {...props}
    />
  )
}
