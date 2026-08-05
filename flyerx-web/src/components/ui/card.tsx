import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — Nocturne Design System
 *
 * Variantes:
 * - default: card básico com background surface
 * - elevated: borda gradiente com sombra (card-elevated)
 * - accent: borda accent com gradiente de fundo (card-accent)
 * - glass: efeito vidro com blur
 */
function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "elevated" | "accent" | "glass"
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-1.5 rounded-xl text-card-foreground",
        // Variantes
        variant === "default" && "bg-card p-2",
        variant === "elevated" && "card-elevated p-6",
        variant === "accent" && "card-accent p-[14px_16px]",
        variant === "glass" && "glass p-2",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-[17px] font-medium leading-[1.2]",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[13px] opacity-80", className)}
      {...props}
    />
  )
}

function CardKicker({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="card-kicker"
      className={cn("kicker", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("flex-1", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-1.5 pt-1.5",
        className
      )}
      {...props}
    />
  )
}

function CardMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-meta"
      className={cn(
        "flex items-center gap-[6px] text-[11px]",
        "text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardKicker,
  CardAction,
  CardDescription,
  CardContent,
  CardMeta,
}
