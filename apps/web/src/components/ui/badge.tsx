import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge/Tag — Nocturne Design System
 *
 * Segue os mockups com as variantes:
 * - accent: fundo accent-800, texto accent-100
 * - outline: borda accent, texto accent
 * - neutral: fundo neutral-800, texto neutral-100
 * - success/warning/error: cores semânticas
 */
const badgeVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "text-[11px] tracking-[0.02em]",
    "px-[10px] py-[3px]",
    "rounded-md",
    "transition-colors",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ].join(" "),
  {
    variants: {
      variant: {
        // Nocturne variants
        accent: "bg-accent-800 text-accent-100",
        outline: "border border-primary text-primary bg-transparent",
        neutral: "bg-neutral-800 text-neutral-100",
        success: "bg-success-muted text-success",
        warning: "bg-warning-muted text-warning",
        error: "bg-error-muted text-error",
        // Aliases para compatibilidade com shadcn
        default: "bg-accent-800 text-accent-100",
        secondary: "bg-neutral-800 text-neutral-100",
        destructive: "bg-error-muted text-error",
      },
      size: {
        default: "text-[11px] px-[10px] py-[3px]",
        sm: "text-[9.5px] px-[6px] py-[1px]",
        lg: "text-[12px] px-[12px] py-[4px]",
      },
    },
    defaultVariants: {
      variant: "accent",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "accent",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
