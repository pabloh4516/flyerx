import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

/**
 * StepsGuide — Nocturne Design System
 *
 * Bloco "como funciona" com lista de passos numerados.
 * Padrao visual: cada passo e um card com background e borda.
 *
 * Decisao de design: a versao com cards (originalmente em send) foi
 * escolhida como padrao oficial do design system para consistencia.
 */

export interface StepItem {
  /** Icone do passo (Lucide) */
  icon: LucideIcon
  /** Titulo do passo */
  title: string
  /** Descricao do passo */
  description: string
}

export interface StepsGuideProps {
  /** Icone do header */
  headerIcon: LucideIcon
  /** Titulo do bloco */
  title: string
  /** Subtitulo do bloco */
  subtitle: string
  /** Lista de passos */
  steps: StepItem[]
  /** Classes adicionais */
  className?: string
}

export function StepsGuide({
  headerIcon: HeaderIcon,
  title,
  subtitle,
  steps,
  className,
}: StepsGuideProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="size-10 rounded-md border border-accent-800 bg-accent-900 text-accent-300 flex items-center justify-center">
          <HeaderIcon className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-neutral-600">{subtitle}</span>
        </div>
      </div>

      {/* Steps */}
      {steps.map((step, index) => (
        <div
          key={index}
          className="border border-border rounded-lg p-3.5 flex gap-3 items-center bg-[color-mix(in_srgb,var(--color-surface)_50%,transparent)]"
        >
          <div className="size-8 rounded-md border border-border flex items-center justify-center relative text-neutral-300 shrink-0">
            <step.icon className="size-3.5" />
            <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-accent-800 text-accent-200 text-[10px] flex items-center justify-center font-medium">
              {index + 1}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{step.title}</span>
            <span className="text-xs text-neutral-500">{step.description}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
