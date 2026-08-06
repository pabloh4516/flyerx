import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * AmountInput — Nocturne Design System
 *
 * Input de valor monetario com prefixo R$ integrado.
 * Estilizado para fluxos de dinheiro (deposito, saque, transferencia).
 *
 * - Fundo escuro via input-elevated (coerente com outros inputs)
 * - Spinners nativos ocultos
 * - Tipografia grande para destaque
 * - Estados focus/error/disabled conforme regras de contraste
 */
export interface AmountInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "size"> {
  /** Tamanho da tipografia do valor */
  valueSize?: "default" | "lg"
  /** Mostra estado de erro */
  error?: boolean
  /** Label acima do input */
  label?: string
  /** Mensagem de erro */
  errorMessage?: string
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  (
    {
      className,
      valueSize = "default",
      error,
      label,
      errorMessage,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
            {label}
          </span>
        )}
        <div
          className={cn(
            // Container
            "flex items-baseline gap-2 rounded-lg p-3.5 tabular-nums transition-all",
            // Fundo e borda via input-elevated
            "input-elevated",
            // Focus-within para o container
            "focus-within:border-primary focus-within:shadow-[0_0_0_1px_var(--color-primary)]",
            // Estado de erro
            error && "border-destructive focus-within:border-destructive focus-within:shadow-[0_0_0_1px_var(--color-destructive)]",
            // Disabled
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "text-neutral-500 select-none shrink-0",
              valueSize === "default" && "text-sm",
              valueSize === "lg" && "text-base"
            )}
          >
            R$
          </span>
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            disabled={disabled}
            className={cn(
              // Reset do input
              "flex-1 min-w-0 bg-transparent border-0 outline-none",
              "text-foreground font-medium caret-primary",
              // Placeholder
              "placeholder:text-neutral-600",
              // Ocultar spinners nativos
              "[appearance:textfield]",
              "[&::-webkit-outer-spin-button]:appearance-none",
              "[&::-webkit-inner-spin-button]:appearance-none",
              // Disabled
              "disabled:cursor-not-allowed",
              // Tamanho da tipografia
              valueSize === "default" && "text-2xl",
              valueSize === "lg" && "text-3xl",
              className
            )}
            {...props}
          />
        </div>
        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
      </div>
    )
  }
)
AmountInput.displayName = "AmountInput"

export { AmountInput }
