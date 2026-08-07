'use client';

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Modal — Nocturne Design System
 *
 * Modal/Dialog com estilo elevated e overlay com blur.
 */
export interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  /** Tamanho do modal */
  size?: "sm" | "default" | "lg" | "xl" | "full"
  /** Mostra botão de fechar */
  showClose?: boolean
  /** Fecha ao clicar no overlay */
  closeOnOverlay?: boolean
}

const sizeClasses = {
  sm: "max-w-[400px]",
  default: "max-w-[500px]",
  lg: "max-w-[640px]",
  xl: "max-w-[800px]",
  full: "max-w-[calc(100vw-48px)] max-h-[calc(100vh-48px)]",
}

export function Modal({
  open,
  onClose,
  children,
  className,
  size = "default",
  showClose = true,
  closeOnOverlay = true,
}: ModalProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onClose])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden",
          "border border-transparent",
          "bg-[linear-gradient(color-mix(in_srgb,var(--color-surface)_95%,transparent),color-mix(in_srgb,var(--color-surface)_90%,transparent))_padding-box,linear-gradient(140deg,var(--color-accent-600),var(--color-neutral-700)_40%,var(--color-neutral-800))_border-box]",
          "shadow-[0_24px_64px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors z-10"
          >
            <X className="size-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * ModalHeader — Cabeçalho do modal
 */
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

export function ModalHeader({
  className,
  title,
  description,
  ...props
}: ModalHeaderProps) {
  return (
    <div
      className={cn("px-6 pt-6 pb-4", className)}
      {...props}
    >
      <h2 className="text-[18px] font-medium pr-8">{title}</h2>
      {description && (
        <p className="text-[13px] text-neutral-500 mt-1">{description}</p>
      )}
    </div>
  )
}

/**
 * ModalContent — Conteúdo do modal
 */
export function ModalContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ModalFooter — Rodapé do modal com ações
 */
export function ModalFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 py-4 mt-2 flex items-center justify-end gap-3",
        "border-t border-border/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
