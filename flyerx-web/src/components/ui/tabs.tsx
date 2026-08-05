'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Tabs — Nocturne Design System
 *
 * Tabs com estilo elevated para a tab ativa.
 */
interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tab components must be used within Tabs")
  }
  return context
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const activeTab = value ?? internalValue

  const setActiveTab = React.useCallback((newValue: string) => {
    if (!value) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [value, onValueChange])

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/**
 * TabsList — Container das tabs
 */
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pills" | "underline"
}

export function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1",
        variant === "default" && "p-1 rounded-lg bg-neutral-900/50 border border-border",
        variant === "pills" && "gap-2",
        variant === "underline" && "gap-0 border-b border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * TabsTrigger — Botão individual da tab
 */
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  icon?: React.ReactNode
}

export function TabsTrigger({
  className,
  value,
  icon,
  children,
  ...props
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-md transition-all",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        // Inactive
        !isActive && "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50",
        // Active - elevated style
        isActive && [
          "text-accent-200",
          "bg-[linear-gradient(color-mix(in_srgb,var(--color-surface)_90%,transparent),color-mix(in_srgb,var(--color-surface)_80%,transparent))_padding-box,linear-gradient(135deg,var(--color-accent-600),var(--color-neutral-700)_60%)_border-box]",
          "border border-transparent",
          "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
        ],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

/**
 * TabsContent — Conteúdo da tab
 */
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({
  className,
  value,
  children,
  ...props
}: TabsContentProps) {
  const { activeTab } = useTabs()

  if (activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn("mt-4 animate-in fade-in-0 duration-200", className)}
      {...props}
    >
      {children}
    </div>
  )
}
