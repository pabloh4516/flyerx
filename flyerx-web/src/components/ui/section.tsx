import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Section — Nocturne Design System
 *
 * Wrapper de seção com título opcional e espaçamento padronizado.
 * Usado para agrupar conteúdo relacionado dentro de uma página.
 */
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Título da seção (opcional) */
  title?: string
  /** Descrição abaixo do título */
  description?: string
  /** Ações no lado direito do header */
  actions?: React.ReactNode
  /** Remove padding interno */
  flush?: boolean
}

export function Section({
  className,
  title,
  description,
  actions,
  flush = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("flex flex-col", !flush && "gap-4", className)}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            {title && (
              <h2 className="text-[9.5px] uppercase tracking-[0.14em] text-neutral-600">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[12px] text-neutral-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * SectionHeader — Header alternativo para seções com estilo diferente
 */
export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  /** Link/ação no lado direito */
  action?: React.ReactNode
}

export function SectionHeader({
  className,
  title,
  action,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 border-b border-border",
        className
      )}
      {...props}
    >
      <span className="text-[13.5px] font-medium">{title}</span>
      {action}
    </div>
  )
}
