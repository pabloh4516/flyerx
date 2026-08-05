import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Typography — Nocturne Design System
 *
 * Componentes de texto padronizados.
 */

// ============================================================================
// HEADING
// ============================================================================

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Nível do heading (h1-h6) */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  /** Tamanho visual (pode ser diferente do nível semântico) */
  size?: "xl" | "lg" | "md" | "sm" | "xs"
}

const headingSizes = {
  xl: "text-[32px] tracking-[-0.02em]",
  lg: "text-[24px] tracking-[-0.02em]",
  md: "text-[18px] tracking-[-0.01em]",
  sm: "text-[15px]",
  xs: "text-[13px]",
}

export function Heading({
  as: Tag = "h2",
  size = "lg",
  className,
  children,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(
        "font-medium text-foreground leading-tight",
        headingSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

// ============================================================================
// TEXT
// ============================================================================

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Elemento HTML */
  as?: "p" | "span" | "div"
  /** Tamanho do texto */
  size?: "lg" | "md" | "sm" | "xs"
  /** Variante de cor */
  variant?: "default" | "muted" | "accent" | "success" | "warning" | "error"
  /** Peso da fonte */
  weight?: "normal" | "medium" | "semibold"
  /** Texto monoespaçado */
  mono?: boolean
}

const textSizes = {
  lg: "text-[15px] leading-relaxed",
  md: "text-[14px] leading-relaxed",
  sm: "text-[13px] leading-relaxed",
  xs: "text-[12px] leading-relaxed",
}

const textVariants = {
  default: "text-foreground",
  muted: "text-neutral-500",
  accent: "text-accent-300",
  success: "text-green-400",
  warning: "text-yellow-400",
  error: "text-red-400",
}

const textWeights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
}

export function Text({
  as: Tag = "p",
  size = "md",
  variant = "default",
  weight = "normal",
  mono = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(
        textSizes[size],
        textVariants[variant],
        textWeights[weight],
        mono && "font-mono",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

// ============================================================================
// LABEL
// ============================================================================

export interface LabelTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tamanho do label */
  size?: "md" | "sm" | "xs"
  /** Variante de cor */
  variant?: "default" | "muted" | "accent"
  /** Usar uppercase */
  uppercase?: boolean
}

const labelSizes = {
  md: "text-[13px]",
  sm: "text-[12px]",
  xs: "text-[11px]",
}

const labelVariants = {
  default: "text-neutral-400",
  muted: "text-neutral-500",
  accent: "text-accent-300",
}

export function LabelText({
  size = "sm",
  variant = "default",
  uppercase = false,
  className,
  children,
  ...props
}: LabelTextProps) {
  return (
    <span
      className={cn(
        labelSizes[size],
        labelVariants[variant],
        uppercase && "uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ============================================================================
// KICKER (Small caps label acima de títulos)
// ============================================================================

export interface KickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent"
}

export function Kicker({
  variant = "accent",
  className,
  children,
  ...props
}: KickerProps) {
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-[0.1em] font-medium",
        variant === "accent" ? "text-accent-400" : "text-neutral-500",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ============================================================================
// MONEY (Valores monetários formatados)
// ============================================================================

export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Valor numérico */
  value: number
  /** Tamanho do texto */
  size?: "xl" | "lg" | "md" | "sm"
  /** Mostrar sinal de + ou - */
  showSign?: boolean
  /** Usar cor baseada no valor (verde positivo, vermelho negativo) */
  colored?: boolean
}

const moneySizes = {
  xl: "text-[28px]",
  lg: "text-[22px]",
  md: "text-[16px]",
  sm: "text-[14px]",
}

export function Money({
  value,
  size = "md",
  showSign = false,
  colored = false,
  className,
  ...props
}: MoneyProps) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value))

  const sign = value >= 0 ? "+" : "-"
  const colorClass = colored
    ? value >= 0
      ? "text-green-400"
      : "text-red-400"
    : ""

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        moneySizes[size],
        colorClass,
        className
      )}
      {...props}
    >
      {showSign && sign}
      {formatted}
    </span>
  )
}
