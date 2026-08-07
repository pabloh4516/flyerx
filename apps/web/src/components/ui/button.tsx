import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — Nocturne Design System
 *
 * Variants seguem os mockups:
 * - primary: borda roxa, texto roxo (outline style)
 * - secondary: borda divider, texto claro
 * - ghost: sem borda, texto roxo
 * - solid: fundo roxo sólido (para CTAs)
 * - destructive: vermelho
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-[6px]",
    "cursor-pointer select-none whitespace-nowrap text-[14px] font-medium",
    "rounded-lg transition-all outline-none",
    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Elevated — borda gradiente (padrão Nocturne)
        elevated: [
          "btn-elevated text-foreground",
          "active:scale-[0.98]",
        ].join(" "),

        // Accent Elevated — borda accent gradiente
        accent: [
          "btn-accent-elevated text-accent-200",
          "active:scale-[0.98]",
        ].join(" "),

        // Primary — borda roxa, texto roxo
        primary: [
          "border border-primary text-primary bg-transparent",
          "hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]",
          "active:bg-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
        ].join(" "),

        // Secondary — borda divider, texto claro
        secondary: [
          "border border-border text-foreground bg-transparent",
          "hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]",
          "active:bg-[color-mix(in_srgb,var(--color-text)_14%,transparent)]",
        ].join(" "),

        // Outline — alias para secondary (compatibilidade)
        outline: [
          "border border-border text-foreground bg-transparent",
          "hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]",
          "active:bg-[color-mix(in_srgb,var(--color-text)_14%,transparent)]",
        ].join(" "),

        // Default — alias para elevated (padrão)
        default: [
          "btn-elevated text-foreground",
          "active:scale-[0.98]",
        ].join(" "),

        // Ghost — sem borda, texto roxo
        ghost: [
          "border-transparent text-primary bg-transparent",
          "hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]",
          "active:bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
        ].join(" "),

        // Solid — fundo roxo sólido (para CTAs principais)
        // Texto DEVE ser escuro para contraste sobre fundo accent claro
        solid: [
          "border-transparent bg-primary text-background",
          "hover:bg-accent-500 hover:text-background",
          "active:bg-accent-600 active:text-background",
        ].join(" "),

        // Destructive — vermelho
        destructive: [
          "border border-destructive/50 text-destructive bg-transparent",
          "hover:bg-destructive/10",
          "active:bg-destructive/20",
        ].join(" "),

        // Link — apenas texto sublinhado
        link: "border-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-2.5 py-1.5",
        sm: "h-8 px-3 py-1.5 text-[13px]",
        lg: "h-12 px-6 py-3 text-[15px]",
        xl: "h-14 px-8 py-4 text-[16px]",
        icon: "size-9 p-0 justify-center",
        "icon-sm": "size-8 p-0 justify-center",
        "icon-lg": "size-10 p-0 justify-center",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean
}

function Button({
  className,
  variant,
  size,
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
