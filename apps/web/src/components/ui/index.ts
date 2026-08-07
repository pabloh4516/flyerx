/**
 * Nocturne Design System — Flyerx
 *
 * Arquivo de exportação centralizado.
 * Importe componentes assim:
 *
 * import { Button, Card, Input, Surface } from "@/components/ui"
 */

// ============================================================================
// LAYOUT
// ============================================================================
export { Container, PageWrapper } from "./container"
export { Divider, DividerWithLabel } from "./divider"
export { Surface, SurfaceHeader, SurfaceFooter } from "./surface"
export { Section } from "./section"

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export { Heading, Text, LabelText, Kicker, Money } from "./typography"

// ============================================================================
// FORMS
// ============================================================================
export { Button } from "./button"
export { Input } from "./input"
export { AmountInput } from "./amount-input"
export { Textarea } from "./textarea"
export { SelectNative, SelectOption } from "./select-native"
export { Checkbox, Radio } from "./checkbox"
export { Switch } from "./switch"
export { FormField, FormSection } from "./form-field"

// ============================================================================
// DATA DISPLAY
// ============================================================================
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card"
export { Badge } from "./badge"
export { StatCard } from "./stat-card"
export { AvatarCustom, AvatarGroup } from "./avatar-custom"
export { IconBox } from "./icon-box"
export { DataRow, DataRowGroup } from "./data-row"
export { ListItem } from "./list-item"

// ============================================================================
// FEEDBACK
// ============================================================================
export { Alert, AlertBanner } from "./alert"
export { Modal, ModalHeader, ModalContent, ModalFooter } from "./modal"
export { TooltipCustom } from "./tooltip-custom"
export { Skeleton, SkeletonCard, SkeletonListItem, SkeletonText } from "./skeleton"

// ============================================================================
// NAVIGATION
// ============================================================================
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu"
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select"

// ============================================================================
// PAGE STRUCTURE
// ============================================================================
export { PageHeader } from "./page-header"
export { EmptyState } from "./empty-state"
export { StepsGuide } from "./steps-guide"
export type { StepItem, StepsGuideProps } from "./steps-guide"
export { TransactionReceipt } from "./transaction-receipt"
export type { TransactionReceiptProps } from "./transaction-receipt"

// ============================================================================
// EFFECTS & NOCTURNE
// ============================================================================
export {
  GlowOrb,
  TransactionIcon,
  ActionCircle,
  IconButton,
  Stat,
  BalanceDisplay,
  Sparkline,
  Logo,
  ProgressRing
} from "./nocturne"
