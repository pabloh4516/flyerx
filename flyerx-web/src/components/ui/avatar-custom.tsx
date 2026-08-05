import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * AvatarCustom — Nocturne Design System
 *
 * Avatar com estilo elevated e fallback para iniciais.
 */
export interface AvatarCustomProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: "xs" | "sm" | "default" | "lg" | "xl"
  variant?: "default" | "elevated" | "accent"
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-[11px]",
  default: "w-10 h-10 text-[13px]",
  lg: "w-12 h-12 text-[15px]",
  xl: "w-16 h-16 text-[18px]",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AvatarCustom({
  className,
  src,
  alt,
  name,
  size = "default",
  variant = "default",
  ...props
}: AvatarCustomProps) {
  const [hasError, setHasError] = React.useState(false)
  const initials = name ? getInitials(name) : "?"

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-medium",
        sizeClasses[size],
        // Variants
        variant === "default" && "bg-neutral-800 border border-border text-neutral-300",
        variant === "elevated" && [
          "border border-transparent",
          "bg-[linear-gradient(color-mix(in_srgb,var(--color-surface)_90%,transparent),color-mix(in_srgb,var(--color-surface)_80%,transparent))_padding-box,linear-gradient(135deg,var(--color-neutral-500),var(--color-neutral-800))_border-box]",
          "text-neutral-300",
        ],
        variant === "accent" && [
          "bg-gradient-to-br from-accent-800 to-accent-900",
          "border border-accent-700",
          "text-accent-200",
        ],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || name || "Avatar"}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

/**
 * AvatarGroup — Grupo de avatares empilhados
 */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: "xs" | "sm" | "default" | "lg"
}

export function AvatarGroup({
  className,
  max = 4,
  size = "default",
  children,
  ...props
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children)
  const visibleChildren = childArray.slice(0, max)
  const remainingCount = childArray.length - max

  return (
    <div
      className={cn("flex -space-x-2", className)}
      {...props}
    >
      {visibleChildren.map((child, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<AvatarCustomProps>, { size })
            : child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center ring-2 ring-background",
            "bg-neutral-800 border border-border text-neutral-400 font-medium",
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
