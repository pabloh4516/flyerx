import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * DataRow — Nocturne Design System
 *
 * Linha de dados chave/valor. Usado em detalhes de transação,
 * configurações, resumos, etc.
 */
export interface DataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label/chave */
  label: string
  /** Valor (pode ser string, número ou ReactNode) */
  value: React.ReactNode
  /** Texto auxiliar abaixo do valor */
  hint?: string
  /** Ação opcional (botão copiar, link, etc.) */
  action?: React.ReactNode
  /** Tamanho */
  size?: "default" | "sm" | "lg"
  /** Alinhamento do valor */
  align?: "left" | "right"
  /** Destaca o valor com cor accent */
  accent?: boolean
  /** Usa fonte mono para o valor */
  mono?: boolean
}

export function DataRow({
  className,
  label,
  value,
  hint,
  action,
  size = "default",
  align = "right",
  accent = false,
  mono = false,
  ...props
}: DataRowProps) {
  const sizeClasses = {
    sm: {
      wrapper: "py-2",
      label: "text-[11px]",
      value: "text-[12px]",
    },
    default: {
      wrapper: "py-3",
      label: "text-[12px]",
      value: "text-[13px]",
    },
    lg: {
      wrapper: "py-4",
      label: "text-[13px]",
      value: "text-[15px]",
    },
  }

  const s = sizeClasses[size]

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border",
        s.wrapper,
        className
      )}
      {...props}
    >
      <span className={cn("text-neutral-500 shrink-0", s.label)}>
        {label}
      </span>

      <div className={cn(
        "flex items-center gap-2 min-w-0",
        align === "right" && "justify-end"
      )}>
        <div className="flex flex-col items-end gap-0.5 min-w-0">
          <span
            className={cn(
              "truncate",
              s.value,
              mono && "font-mono",
              accent ? "text-accent-200" : "text-foreground"
            )}
          >
            {value}
          </span>
          {hint && (
            <span className="text-[10px] text-neutral-600">{hint}</span>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}

/**
 * DataRowGroup — Container para agrupar DataRows
 */
export interface DataRowGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Título do grupo */
  title?: string
  /** Remove borda do último item */
  noBorderLast?: boolean
}

export function DataRowGroup({
  className,
  title,
  noBorderLast = true,
  children,
  ...props
}: DataRowGroupProps) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {title && (
        <span className="text-[9.5px] uppercase tracking-[0.14em] text-neutral-600 pb-2">
          {title}
        </span>
      )}
      <div className={cn(
        "flex flex-col",
        noBorderLast && "[&>*:last-child]:border-b-0"
      )}>
        {children}
      </div>
    </div>
  )
}
