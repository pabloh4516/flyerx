import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Surface — Nocturne Design System
 *
 * Container com background e borda padronizados.
 * Use para agrupar conteúdo relacionado.
 */
export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual */
  variant?: "default" | "elevated" | "accent" | "ghost"
  /** Padding interno */
  padding?: "none" | "sm" | "md" | "lg"
  /** Borda tracejada (para estados vazios, uploads, etc) */
  dashed?: boolean
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
}

export function Surface({
  variant = "default",
  padding = "md",
  dashed = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        paddingClasses[padding],
        // Variants
        variant === "default" && [
          "bg-surface border",
          dashed ? "border-dashed border-divider" : "border-divider",
        ],
        variant === "elevated" && "card-elevated",
        variant === "accent" && "card-accent border border-accent-800",
        variant === "ghost" && "bg-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * SurfaceHeader — Nocturne Design System
 *
 * Header para Surface com ícone, título e ações.
 */
export interface SurfaceHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ícone (componente React) */
  icon?: React.ReactNode
  /** Título */
  title: string
  /** Descrição opcional */
  description?: string
  /** Ações (botões, etc) */
  actions?: React.ReactNode
}

export function SurfaceHeader({
  icon,
  title,
  description,
  actions,
  className,
  ...props
}: SurfaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pb-4 border-b border-divider mb-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent-300">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-[14px] font-medium">{title}</h3>
          {description && (
            <p className="text-[11px] text-neutral-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * SurfaceFooter — Nocturne Design System
 *
 * Footer para Surface.
 */
export interface SurfaceFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SurfaceFooter({
  className,
  children,
  ...props
}: SurfaceFooterProps) {
  return (
    <div
      className={cn(
        "pt-4 mt-4 border-t border-divider flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
