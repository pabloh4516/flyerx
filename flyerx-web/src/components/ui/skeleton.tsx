import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Skeleton — Nocturne Design System
 *
 * Loading placeholder com animação shimmer no estilo Nocturne.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text"
  width?: number | string
  height?: number | string
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse",
        "bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800",
        "bg-[length:200%_100%]",
        variant === "default" && "rounded-lg",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded-sm h-4",
        className
      )}
      style={{
        width,
        height,
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
      {...props}
    />
  )
}

/**
 * SkeletonCard — Skeleton para cards
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("stat-elevated p-5 flex flex-col gap-4", className)}>
      <div className="flex justify-between">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="circular" width={20} height={20} />
      </div>
      <Skeleton variant="text" width={120} height={32} />
      <Skeleton variant="text" width={160} height={12} />
    </div>
  )
}

/**
 * SkeletonListItem — Skeleton para itens de lista
 */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 px-5 py-4 border-b border-border", className)}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height={10} />
      </div>
      <Skeleton width={80} height={24} />
    </div>
  )
}

/**
 * SkeletonText — Skeleton para blocos de texto
 */
export interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  )
}

// Add shimmer animation to globals.css if not present
// @keyframes shimmer {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }
