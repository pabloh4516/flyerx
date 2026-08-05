import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Nocturne Components — Componentes específicos do design system
 *
 * Componentes extraídos dos mockups que não existem no shadcn padrão.
 */

// ─────────────────────────────────────────────────────────────────────────
// Transaction Icon — Ícone de transação (entrada/saída)
// ─────────────────────────────────────────────────────────────────────────
export interface TransactionIconProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "in" | "out" | "link" | "pending"
  size?: "sm" | "default" | "lg"
}

export function TransactionIcon({
  className,
  type,
  size = "default",
  children,
  ...props
}: TransactionIconProps) {
  const sizeClasses = {
    sm: "size-8",
    default: "size-[34px]",
    lg: "size-10",
  }

  const typeClasses = {
    in: "bg-accent-900 border-accent-800 text-accent-300",
    out: "bg-neutral-900 border-neutral-800 text-neutral-400",
    link: "bg-accent-900 border-accent-800 text-accent-300",
    pending: "bg-neutral-900 border-neutral-800 text-neutral-500",
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 rounded-md border",
        sizeClasses[size],
        typeClasses[type],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Action Circle — Botão de ação circular (Depositar, Sacar, etc.)
// ─────────────────────────────────────────────────────────────────────────
export interface ActionCircleProps extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
  size?: "default" | "lg"
  label?: string
  disabled?: boolean
}

export function ActionCircle({
  className,
  variant = "secondary",
  size = "default",
  label,
  children,
  disabled,
  ...props
}: ActionCircleProps) {
  const sizeClasses = {
    default: "size-[52px]",
    lg: "size-16",
  }

  const variantClasses = {
    primary: [
      "border-primary text-accent-300",
      "bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]",
      "hover:bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
    ].join(" "),
    secondary: [
      "border-border text-neutral-300",
      "hover:border-neutral-600 hover:text-neutral-200",
    ].join(" "),
  }

  return (
    <div className="flex flex-col items-center gap-[7px]">
      <button
        className={cn(
          "flex items-center justify-center rounded-full border transition-colors",
          sizeClasses[size],
          variantClasses[variant],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
      {label && (
        <span className="text-[11px] text-neutral-300">{label}</span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Icon Button — Botão de ícone circular (notificações, config, etc.)
// ─────────────────────────────────────────────────────────────────────────
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default" | "lg"
  hasNotification?: boolean
}

export function IconButton({
  className,
  size = "default",
  hasNotification,
  children,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "size-8",
    default: "size-[34px]",
    lg: "size-10",
  }

  return (
    <button
      className={cn(
        "relative flex items-center justify-center rounded-full",
        "border border-border text-neutral-400",
        "hover:border-primary hover:text-accent-300",
        "transition-colors",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {hasNotification && (
        <span className="absolute top-[5px] right-[7px] size-[6px] rounded-full bg-primary shadow-[0_0_6px_var(--color-accent)]" />
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Glow Orb — Orb de glow para backgrounds
// ─────────────────────────────────────────────────────────────────────────
export interface GlowOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "section" | "accent"
  size?: number
}

export function GlowOrb({
  className,
  variant = "section",
  size = 400,
  style,
  ...props
}: GlowOrbProps) {
  return (
    <div
      className={cn(
        variant === "section" ? "glow-orb" : "glow-orb-accent",
        className
      )}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Divider — Linha horizontal com fade nas pontas (assinatura Nocturne)
// ─────────────────────────────────────────────────────────────────────────
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  fade?: boolean
}

export function Divider({
  className,
  fade = true,
  ...props
}: DividerProps) {
  return (
    <div
      className={cn(
        fade ? "hr-fade" : "h-px bg-border",
        className
      )}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Stat Card — Card de estatística (Entradas, Saídas, etc.)
// ─────────────────────────────────────────────────────────────────────────
export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

export function Stat({
  className,
  label,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  ...props
}: StatProps) {
  return (
    <div className={cn("flex flex-col gap-[3px]", className)} {...props}>
      <span className="text-[10px] text-neutral-600 uppercase tracking-[0.09em]">
        {label}
      </span>
      <span className={cn(
        "text-[16px] font-medium tabular-nums",
        trend === "up" && "text-accent-200",
        trend === "down" && "text-neutral-300",
      )}>
        {prefix}{value}{suffix}
      </span>
      {trendValue && (
        <span className={cn(
          "text-[11px] flex items-center gap-1",
          trend === "up" && "text-accent-300",
          trend === "down" && "text-neutral-500",
        )}>
          {trendValue}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Balance Display — Exibição de saldo com estilo Nocturne
// ─────────────────────────────────────────────────────────────────────────
export interface BalanceDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  currency?: string
  size?: "default" | "lg" | "xl"
  showCents?: boolean
}

export function BalanceDisplay({
  className,
  value,
  currency = "R$",
  size = "default",
  showCents = true,
  ...props
}: BalanceDisplayProps) {
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [integer, cents] = formatted.split(",")

  const sizeClasses = {
    default: {
      currency: "text-[16px] text-neutral-500",
      integer: "text-[42px]",
      cents: "text-[24px] text-neutral-400",
    },
    lg: {
      currency: "text-[17px] text-neutral-500",
      integer: "text-[44px]",
      cents: "text-[26px] text-neutral-400",
    },
    xl: {
      currency: "text-[20px] text-neutral-500",
      integer: "text-[56px]",
      cents: "text-[32px] text-neutral-400",
    },
  }

  const s = sizeClasses[size]

  return (
    <div
      className={cn(
        "flex items-baseline gap-2 tabular-nums font-medium tracking-tight leading-none",
        className
      )}
      {...props}
    >
      <span className={s.currency}>{currency}</span>
      <span className={s.integer}>
        {integer}
        {showCents && (
          <span className={s.cents}>,{cents}</span>
        )}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Sparkline — Mini gráfico de tendência
// ─────────────────────────────────────────────────────────────────────────
export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data?: number[]
  trend?: "up" | "down" | "neutral"
}

export function Sparkline({
  className,
  data = [15, 13, 14, 10, 12, 6, 8, 3],
  trend = "up",
  width = 72,
  height = 20,
  ...props
}: SparklineProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (Number(width) - 2) + 1
    const y = Number(height) - ((v - min) / range) * (Number(height) - 4) - 2
    return `${x},${y}`
  })

  const pathD = `M${points.join(" L")}`

  const strokeColor = trend === "up"
    ? "var(--color-accent)"
    : trend === "down"
      ? "var(--color-neutral-500)"
      : "var(--color-neutral-400)"

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      {...props}
    >
      <path
        d={pathD}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Logo — Logo do Flyerx
// ─────────────────────────────────────────────────────────────────────────
export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "default" | "lg"
}

export function Logo({
  className,
  size = "default",
  ...props
}: LogoProps) {
  const sizeClasses = {
    sm: "text-[14px]",
    default: "text-[15.5px]",
    lg: "text-[18px]",
  }

  return (
    <span
      className={cn(
        "font-semibold",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      flyer<span className="text-primary">x</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Progress Ring — Anel de progresso circular
// ─────────────────────────────────────────────────────────────────────────
export interface ProgressRingProps extends React.SVGAttributes<SVGSVGElement> {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function ProgressRing({
  className,
  value,
  size = 40,
  strokeWidth = 4,
  showLabel = true,
  ...props
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      {...props}
    >
      {/* Background */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--color-neutral-800)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--color-accent)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Label */}
      {showLabel && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="text-[10px] fill-accent-200"
          fontFamily="Inter"
        >
          {value}%
        </text>
      )}
    </svg>
  )
}
