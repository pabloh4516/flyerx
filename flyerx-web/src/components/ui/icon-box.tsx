import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * IconBox — Nocturne Design System
 *
 * Container quadrado para ícones com variantes de cor.
 */
export interface IconBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tamanho do box */
  size?: "sm" | "md" | "lg"
  /** Variante de cor */
  variant?: "default" | "accent" | "success" | "warning" | "error" | "muted"
  /** Formato */
  shape?: "square" | "circle"
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
}

const iconSizes = {
  sm: "[&>svg]:size-4",
  md: "[&>svg]:size-5",
  lg: "[&>svg]:size-6",
}

const variantClasses = {
  default: "bg-neutral-900 border-neutral-800 text-neutral-400",
  accent: "bg-accent/10 border-accent/30 text-accent-300",
  success: "bg-green-500/10 border-green-500/30 text-green-400",
  warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  error: "bg-red-500/10 border-red-500/30 text-red-400",
  muted: "bg-neutral-800/50 border-neutral-700 text-neutral-500",
}

const shapeClasses = {
  square: "rounded-lg",
  circle: "rounded-full",
}

export function IconBox({
  size = "md",
  variant = "default",
  shape = "square",
  className,
  children,
  ...props
}: IconBoxProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border flex-shrink-0",
        sizeClasses[size],
        iconSizes[size],
        variantClasses[variant],
        shapeClasses[shape],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
