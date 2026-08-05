import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * FormField — Nocturne Design System
 *
 * Wrapper para campos de formulário com label, hint e erro.
 * Mantém consistência visual em todos os forms.
 */
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label do campo */
  label?: string
  /** Texto de ajuda abaixo do campo */
  hint?: string
  /** Mensagem de erro */
  error?: string
  /** Campo obrigatório */
  required?: boolean
  /** ID do input (para acessibilidade) */
  htmlFor?: string
}

export function FormField({
  className,
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium text-neutral-300 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-accent-400">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <span className="text-[11px] text-neutral-600">{hint}</span>
      )}

      {error && (
        <span className="text-[11px] text-error flex items-center gap-1">
          <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 112 0v3a1 1 0 11-2 0V5zm1 7a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * FormSection — Grupo de campos com título
 */
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export function FormSection({
  className,
  title,
  description,
  children,
  ...props
}: FormSectionProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {(title || description) && (
        <div className="flex flex-col gap-1">
          {title && (
            <h3 className="text-[14px] font-medium">{title}</h3>
          )}
          {description && (
            <p className="text-[12px] text-neutral-500">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}
