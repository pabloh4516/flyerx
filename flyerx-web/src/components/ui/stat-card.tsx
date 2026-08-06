import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * StatCard — Nocturne Design System
 *
 * Card de estatística com valor, label, e indicador de tendência.
 * Usado em dashboards para métricas importantes.
 *
 * Variantes:
 * - elevated (padrão): borda gradiente com sombra
 * - accent: borda accent mais forte
 * - flat: borda simples
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label/título da métrica */
  label: string
  /** Valor principal */
  value: string | number
  /** Prefixo do valor (ex: "R$") */
  prefix?: string
  /** Sufixo do valor (ex: "%") */
  suffix?: string
  /** Tendência: up, down, ou neutral */
  trend?: "up" | "down" | "neutral"
  /** Valor da tendência (ex: "+12%") */
  trendValue?: string
  /** Descrição adicional */
  description?: string
  /** Ícone opcional */
  icon?: React.ReactNode
  /** Variante do card */
  variant?: "elevated" | "accent" | "flat"
}

export function StatCard({
  className,
  label,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  description,
  icon,
  variant = "elevated",
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "p-5 flex flex-col gap-3",
        variant === "elevated" && "stat-elevated",
        variant === "accent" && "stat-accent",
        variant === "flat" && "bg-card border border-border rounded-xl",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-neutral-500 uppercase tracking-[0.08em]">
          {label}
        </span>
        {icon && (
          <div className="text-neutral-500">{icon}</div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        {prefix && (
          <span className="text-[14px] text-neutral-500">{prefix}</span>
        )}
        <span className="text-[28px] font-medium tracking-tight tabular-nums">
          {value}
        </span>
        {suffix && (
          <span className="text-[14px] text-neutral-500">{suffix}</span>
        )}
      </div>

      {/* Trend & Description */}
      {(trend || description) && (
        <div className="flex items-center gap-2">
          {trend && trendValue && (
            <span
              className={cn(
                "flex items-center gap-1 text-[11px]",
                trend === "up" && "text-success",
                trend === "down" && "text-error",
                trend === "neutral" && "text-neutral-500"
              )}
            >
              {trend === "up" && <TrendingUp className="size-3" />}
              {trend === "down" && <TrendingDown className="size-3" />}
              {trendValue}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-neutral-600">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * StatGroup — Grid de StatCards
 */
export interface StatGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Número de colunas */
  columns?: 2 | 3 | 4
}

export function StatGroup({
  className,
  columns = 3,
  children,
  ...props
}: StatGroupProps) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }

  return (
    <div
      className={cn("grid gap-4", colClasses[columns], className)}
      {...props}
    >
      {children}
    </div>
  )
}
