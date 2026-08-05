import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ListItem — Nocturne Design System
 *
 * Item de lista padronizado com ícone, título, descrição e ação.
 * Pode ser clicável (link ou button) ou estático.
 */
export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ícone ou elemento visual à esquerda */
  icon?: React.ReactNode
  /** Título principal */
  title: string
  /** Descrição secundária */
  description?: string
  /** Conteúdo à direita (valor, badge, etc.) */
  trailing?: React.ReactNode
  /** Mostra chevron indicando navegação */
  showChevron?: boolean
  /** Indica estado ativo/selecionado */
  active?: boolean
  /** Se true, adiciona hover state */
  interactive?: boolean
  /** Variante visual */
  variant?: "default" | "compact"
}

export function ListItem({
  className,
  icon,
  title,
  description,
  trailing,
  showChevron = false,
  active = false,
  interactive = true,
  variant = "default",
  ...props
}: ListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 border-b border-border",
        variant === "default" ? "px-5 py-3.5" : "px-4 py-2.5",
        interactive && "cursor-pointer hover:bg-neutral-900/30 transition-colors",
        active && "bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="shrink-0">{icon}</div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className={cn(
          "truncate",
          variant === "default" ? "text-[13px]" : "text-[12.5px]"
        )}>
          {title}
        </span>
        {description && (
          <span className="text-[11px] text-neutral-600 truncate">
            {description}
          </span>
        )}
      </div>

      {trailing && (
        <div className="shrink-0 flex items-center gap-2">
          {trailing}
        </div>
      )}

      {showChevron && (
        <ChevronRight className="size-4 text-neutral-700 shrink-0" />
      )}
    </div>
  )
}

/**
 * ListItemGroup — Container para agrupar ListItems
 */
export interface ListItemGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove borda do último item */
  noBorderLast?: boolean
}

export function ListItemGroup({
  className,
  noBorderLast = true,
  children,
  ...props
}: ListItemGroupProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        noBorderLast && "[&>*:last-child]:border-b-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
