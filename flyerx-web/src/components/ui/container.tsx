import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Container — Nocturne Design System
 *
 * Wrapper responsivo para conteúdo de página.
 * Centraliza e limita a largura máxima.
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Largura máxima do container */
  size?: "sm" | "md" | "lg" | "xl" | "full"
  /** Adiciona padding horizontal */
  padded?: boolean
}

const sizeClasses = {
  sm: "max-w-2xl",      // 672px
  md: "max-w-4xl",      // 896px
  lg: "max-w-6xl",      // 1152px
  xl: "max-w-7xl",      // 1280px
  full: "max-w-full",
}

export function Container({
  className,
  size = "lg",
  padded = true,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        sizeClasses[size],
        padded && "px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * PageWrapper — Nocturne Design System
 *
 * Wrapper para páginas inteiras com padding e espaçamento padrão.
 */
export interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Título da página (para acessibilidade) */
  title?: string
}

export function PageWrapper({
  className,
  title,
  children,
  ...props
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-background",
        "p-6 flex flex-col gap-6",
        className
      )}
      aria-label={title}
      {...props}
    >
      {children}
    </main>
  )
}
