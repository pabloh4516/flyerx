'use client';

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Checkbox — Nocturne Design System
 *
 * Checkbox com estilo elevated e animação suave.
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "accent"
}

export function Checkbox({
  className,
  label,
  description,
  variant = "default",
  checked,
  ...props
}: CheckboxProps) {
  return (
    <label className={cn("flex items-start gap-3 cursor-pointer group", className)}>
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            // Unchecked
            !checked && [
              "border-transparent",
              variant === "default" && "input-elevated",
              variant === "accent" && "border-accent-700 bg-accent-900/30",
            ],
            // Checked
            checked && [
              "border-accent bg-accent text-primary-foreground",
              "shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
            ]
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className="text-[13px] text-foreground group-hover:text-accent-200 transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-neutral-500">{description}</span>
          )}
        </div>
      )}
    </label>
  )
}

/**
 * Radio — Nocturne Design System
 *
 * Radio button com estilo elevated.
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: React.ReactNode
}

export function Radio({
  className,
  label,
  description,
  checked,
  ...props
}: RadioProps) {
  return (
    <label className={cn("flex items-start gap-3 cursor-pointer group", className)}>
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="radio"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "w-5 h-5 rounded-full border transition-all flex items-center justify-center",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            // Unchecked
            !checked && "input-elevated",
            // Checked
            checked && [
              "border-accent bg-surface",
              "shadow-[0_0_6px_color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
            ]
          )}
        >
          {checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_4px_color-mix(in_srgb,var(--color-accent)_50%,transparent)]" />
          )}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className="text-[13px] text-foreground group-hover:text-accent-200 transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-neutral-500">{description}</span>
          )}
        </div>
      )}
    </label>
  )
}
