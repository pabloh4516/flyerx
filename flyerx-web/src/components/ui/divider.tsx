import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Divider — Nocturne Design System
 *
 * Linha separadora horizontal ou vertical.
 */
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientação da linha */
  orientation?: "horizontal" | "vertical"
  /** Variante visual */
  variant?: "default" | "fade" | "accent"
  /** Espaçamento vertical/horizontal */
  spacing?: "none" | "sm" | "md" | "lg"
}

const spacingClasses = {
  none: "",
  sm: "my-2",
  md: "my-4",
  lg: "my-6",
}

const spacingVerticalClasses = {
  none: "",
  sm: "mx-2",
  md: "mx-4",
  lg: "mx-6",
}

export function Divider({
  className,
  orientation = "horizontal",
  variant = "default",
  spacing = "md",
  ...props
}: DividerProps) {
  const isHorizontal = orientation === "horizontal"

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        // Base
        isHorizontal ? "w-full h-px" : "h-full w-px",
        // Spacing
        isHorizontal ? spacingClasses[spacing] : spacingVerticalClasses[spacing],
        // Variants
        variant === "default" && "bg-border",
        variant === "fade" && [
          "bg-transparent",
          isHorizontal
            ? "bg-gradient-to-r from-transparent via-border to-transparent"
            : "bg-gradient-to-b from-transparent via-border to-transparent",
        ],
        variant === "accent" && "bg-accent-800",
        className
      )}
      {...props}
    />
  )
}

/**
 * DividerWithLabel — Nocturne Design System
 *
 * Linha separadora com texto no meio.
 */
export interface DividerWithLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Texto do label */
  label: string
}

export function DividerWithLabel({
  className,
  label,
  ...props
}: DividerWithLabelProps) {
  return (
    <div
      className={cn("flex items-center gap-4 my-4", className)}
      {...props}
    >
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-neutral-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
