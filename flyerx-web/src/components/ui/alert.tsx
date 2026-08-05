import * as React from "react"
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Alert — Nocturne Design System
 *
 * Componente de alerta/notificação com estilo elevated.
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  icon?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

const variantConfig = {
  info: {
    icon: Info,
    borderClass: "border-accent-700",
    bgClass: "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-section)_40%,var(--color-surface)),var(--color-surface)_70%)]",
    iconClass: "text-accent-300",
    titleClass: "text-accent-200",
  },
  success: {
    icon: CheckCircle,
    borderClass: "border-success/50",
    bgClass: "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-success-muted)_60%,var(--color-surface)),var(--color-surface)_70%)]",
    iconClass: "text-success",
    titleClass: "text-success",
  },
  warning: {
    icon: AlertCircle,
    borderClass: "border-warning/50",
    bgClass: "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-warning-muted)_60%,var(--color-surface)),var(--color-surface)_70%)]",
    iconClass: "text-warning",
    titleClass: "text-warning",
  },
  error: {
    icon: XCircle,
    borderClass: "border-error/50",
    bgClass: "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-error-muted)_60%,var(--color-surface)),var(--color-surface)_70%)]",
    iconClass: "text-error",
    titleClass: "text-error",
  },
}

export function Alert({
  className,
  variant = "info",
  title,
  icon,
  dismissible,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 p-4 rounded-xl border",
        config.borderClass,
        config.bgClass,
        "shadow-[0_4px_16px_rgba(0,0,0,0.25)]",
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0 mt-0.5", config.iconClass)}>
        {icon || <IconComponent className="size-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-1">
        {title && (
          <span className={cn("text-[14px] font-medium", config.titleClass)}>
            {title}
          </span>
        )}
        {children && (
          <div className="text-[13px] text-neutral-400">
            {children}
          </div>
        )}
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/**
 * AlertBanner — Banner de alerta para topo de página
 */
export interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error"
  dismissible?: boolean
  onDismiss?: () => void
}

export function AlertBanner({
  className,
  variant = "info",
  dismissible,
  onDismiss,
  children,
  ...props
}: AlertBannerProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2.5 border-b",
        config.borderClass,
        config.bgClass,
        className
      )}
      {...props}
    >
      <IconComponent className={cn("size-4", config.iconClass)} />
      <span className="text-[13px] text-neutral-300">{children}</span>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="ml-2 p-0.5 rounded text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
