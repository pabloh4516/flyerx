'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Switch — Nocturne Design System
 *
 * Toggle switch com estilo elevated e glow quando ativo.
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  size?: "default" | "sm" | "lg"
}

export function Switch({
  className,
  label,
  description,
  size = "default",
  checked,
  ...props
}: SwitchProps) {
  const sizeClasses = {
    sm: { track: "w-8 h-[18px]", thumb: "w-3.5 h-3.5", translate: "translate-x-[14px]" },
    default: { track: "w-10 h-[22px]", thumb: "w-4 h-4", translate: "translate-x-[18px]" },
    lg: { track: "w-12 h-[26px]", thumb: "w-5 h-5", translate: "translate-x-[22px]" },
  }

  const s = sizeClasses[size]

  return (
    <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "rounded-full transition-all",
            s.track,
            "peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            // Unchecked - borda e preenchimento visíveis sobre qualquer superfície
            !checked && [
              "bg-neutral-800 border border-neutral-600",
            ],
            // Checked - accent vibrante com glow sutil
            checked && [
              "bg-primary",
              "shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_25%,transparent)]",
            ]
          )}
        />
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 left-[3px] rounded-full transition-all",
            s.thumb,
            !checked && "bg-neutral-400",
            checked && [
              "bg-white",
              s.translate,
              "shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
            ]
          )}
        />
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
