import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * EmptyState — Nocturne Design System
 *
 * Estado vazio para listas, tabelas, etc.
 * Exibe ícone, título, descrição e ação opcional.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ícone ou ilustração */
  icon?: React.ReactNode
  /** Título principal */
  title: string
  /** Descrição explicativa */
  description?: string
  /** Ação (botão CTA) */
  action?: React.ReactNode
  /** Tamanho/padding */
  size?: "default" | "sm" | "lg"
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  size = "default",
  ...props
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "py-6 gap-3",
    default: "py-10 gap-4",
    lg: "py-16 gap-5",
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-neutral-500">
          {icon}
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[280px]">
        <span className="text-[14px] font-medium text-neutral-300">
          {title}
        </span>
        {description && (
          <p className="text-[12.5px] text-neutral-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  )
}
