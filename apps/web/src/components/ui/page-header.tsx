import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader — Nocturne Design System
 *
 * Cabeçalho de página com título, descrição e ações opcionais.
 * Usado no topo de cada página para manter consistência.
 */
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  /** Slot para ações (botões, etc.) no lado direito */
  actions?: React.ReactNode
  /** Kicker/label acima do título */
  kicker?: string
  /** Tamanho do título */
  size?: "default" | "lg"
}

export function PageHeader({
  className,
  title,
  description,
  actions,
  kicker,
  size = "default",
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {kicker && (
          <span className="text-[10px] uppercase tracking-[0.12em] text-accent-400">
            {kicker}
          </span>
        )}
        <h1
          className={cn(
            "font-medium tracking-tight",
            size === "default" ? "text-[22px]" : "text-[28px]"
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-neutral-500 max-w-[480px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
