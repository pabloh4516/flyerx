'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Heart,
  Home,
  Key,
  Loader2,
  Mail,
  Plus,
  Search,
  Settings,
  Shield,
  Star,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react'

// Design System Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Section } from '@/components/ui/section'
import { ListItem } from '@/components/ui/list-item'
import { EmptyState } from '@/components/ui/empty-state'
import { GlowOrb } from '@/components/ui/nocturne'
import { FormField } from '@/components/ui/form-field'
import { Textarea } from '@/components/ui/textarea'
import { SelectNative, SelectOption } from '@/components/ui/select-native'
import { Checkbox, Radio } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Alert } from '@/components/ui/alert'
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/modal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AvatarCustom, AvatarGroup } from '@/components/ui/avatar-custom'
import { Skeleton, SkeletonCard, SkeletonListItem } from '@/components/ui/skeleton'
import { TooltipCustom } from '@/components/ui/tooltip-custom'

// Novos componentes
import { Container } from '@/components/ui/container'
import { Divider, DividerWithLabel } from '@/components/ui/divider'
import { Surface, SurfaceHeader } from '@/components/ui/surface'
import { Heading, Text, LabelText, Kicker, Money } from '@/components/ui/typography'
import { IconBox } from '@/components/ui/icon-box'

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [radioValue, setRadioValue] = useState('option1')
  const [switchChecked, setSwitchChecked] = useState(true)
  const [activeTab, setActiveTab] = useState('tab1')

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <GlowOrb variant="section" size={600} className="top-[-200px] right-[-200px] opacity-40" />
      <GlowOrb variant="accent" size={500} className="bottom-[-150px] left-[-150px] opacity-30" />

      <Container size="xl" className="py-12 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <Kicker className="mb-2">Flyerx</Kicker>
          <Heading as="h1" size="xl" className="mb-3">
            Nocturne Design System
          </Heading>
          <Text variant="muted" size="lg" className="max-w-2xl">
            Sistema de design para a plataforma Flyerx. Todos os componentes seguem o tema escuro
            com accent roxo/blurple e arredondamentos consistentes.
          </Text>
        </div>

        <Divider variant="fade" spacing="lg" />

        {/* ================================================================
            TOKENS
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Design Tokens</Heading>

          {/* Cores */}
          <Surface padding="lg" className="mb-6">
            <Heading as="h3" size="sm" className="mb-4">Cores</Heading>

            <div className="space-y-4">
              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Accent</LabelText>
                <div className="flex gap-2">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => (
                    <div key={n} className="text-center">
                      <div
                        className={`w-12 h-12 rounded-lg bg-accent-${n} border border-white/10`}
                      />
                      <Text size="xs" variant="muted" className="mt-1">{n}</Text>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Neutral</LabelText>
                <div className="flex gap-2">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => (
                    <div key={n} className="text-center">
                      <div
                        className={`w-12 h-12 rounded-lg bg-neutral-${n} border border-white/10`}
                      />
                      <Text size="xs" variant="muted" className="mt-1">{n}</Text>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Semantic</LabelText>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-green-500 border border-white/10" />
                    <Text size="xs" variant="muted" className="mt-1">Success</Text>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500 border border-white/10" />
                    <Text size="xs" variant="muted" className="mt-1">Warning</Text>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-red-500 border border-white/10" />
                    <Text size="xs" variant="muted" className="mt-1">Error</Text>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          {/* Radius */}
          <Surface padding="lg">
            <Heading as="h3" size="sm" className="mb-4">Border Radius</Heading>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-800 border border-accent-600 rounded-sm" />
                <Text size="xs" variant="muted" className="mt-2">rounded-sm</Text>
                <Text size="xs" variant="muted">4px</Text>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-800 border border-accent-600 rounded-md" />
                <Text size="xs" variant="muted" className="mt-2">rounded-md</Text>
                <Text size="xs" variant="muted">8px</Text>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-800 border border-accent-600 rounded-lg" />
                <Text size="xs" variant="muted" className="mt-2">rounded-lg</Text>
                <Text size="xs" variant="muted">14px</Text>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-800 border border-accent-600 rounded-xl" />
                <Text size="xs" variant="muted" className="mt-2">rounded-xl</Text>
                <Text size="xs" variant="muted">20px</Text>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-800 border border-accent-600 rounded-full" />
                <Text size="xs" variant="muted" className="mt-2">rounded-full</Text>
                <Text size="xs" variant="muted">9999px</Text>
              </div>
            </div>
          </Surface>
        </section>

        {/* ================================================================
            TYPOGRAPHY
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Typography</Heading>

          <Surface padding="lg">
            <div className="space-y-6">
              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Headings</LabelText>
                <div className="space-y-2">
                  <Heading as="h1" size="xl">Heading XL (32px)</Heading>
                  <Heading as="h2" size="lg">Heading LG (24px)</Heading>
                  <Heading as="h3" size="md">Heading MD (18px)</Heading>
                  <Heading as="h4" size="sm">Heading SM (15px)</Heading>
                  <Heading as="h5" size="xs">Heading XS (13px)</Heading>
                </div>
              </div>

              <Divider />

              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Text</LabelText>
                <div className="space-y-2">
                  <Text size="lg">Text LG - Texto grande para destaque</Text>
                  <Text size="md">Text MD - Texto padrão do body</Text>
                  <Text size="sm">Text SM - Texto secundário menor</Text>
                  <Text size="xs">Text XS - Texto pequeno para legendas</Text>
                </div>
              </div>

              <Divider />

              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Variantes</LabelText>
                <div className="space-y-2">
                  <Text variant="default">Default - Cor padrão</Text>
                  <Text variant="muted">Muted - Texto secundário</Text>
                  <Text variant="accent">Accent - Texto destacado</Text>
                  <Text variant="success">Success - Positivo</Text>
                  <Text variant="warning">Warning - Atenção</Text>
                  <Text variant="error">Error - Negativo</Text>
                </div>
              </div>

              <Divider />

              <div>
                <LabelText size="xs" uppercase className="mb-2 block">Money</LabelText>
                <div className="flex gap-8">
                  <div>
                    <Text size="xs" variant="muted" className="mb-1">Normal</Text>
                    <Money value={1234.56} size="lg" />
                  </div>
                  <div>
                    <Text size="xs" variant="muted" className="mb-1">Colored Positive</Text>
                    <Money value={1234.56} size="lg" showSign colored />
                  </div>
                  <div>
                    <Text size="xs" variant="muted" className="mb-1">Colored Negative</Text>
                    <Money value={-567.89} size="lg" showSign colored />
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </section>

        {/* ================================================================
            BUTTONS
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Buttons</Heading>

          <Surface padding="lg">
            <div className="space-y-6">
              <div>
                <LabelText size="xs" uppercase className="mb-3 block">Variants</LabelText>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="elevated">Elevated</Button>
                  <Button variant="accent">Accent</Button>
                </div>
              </div>

              <Divider />

              <div>
                <LabelText size="xs" uppercase className="mb-3 block">Sizes</LabelText>
                <div className="flex items-center gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="default">Default</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" size="icon"><Plus className="size-4" /></Button>
                </div>
              </div>

              <Divider />

              <div>
                <LabelText size="xs" uppercase className="mb-3 block">States</LabelText>
                <div className="flex gap-3">
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button variant="primary">
                    <Loader2 className="size-4 animate-spin" />
                    Loading
                  </Button>
                  <Button variant="primary">
                    <Download className="size-4" />
                    With Icon
                  </Button>
                </div>
              </div>
            </div>
          </Surface>
        </section>

        {/* ================================================================
            FORMS
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Forms</Heading>

          <div className="grid grid-cols-2 gap-6">
            <Surface padding="lg">
              <Heading as="h3" size="sm" className="mb-4">Input & Textarea</Heading>
              <div className="space-y-4">
                <FormField label="Email" hint="Seu email de acesso">
                  <Input type="email" placeholder="seu@email.com" />
                </FormField>
                <FormField label="Senha" error="Senha muito curta">
                  <Input type="password" placeholder="••••••••" />
                </FormField>
                <FormField label="Mensagem">
                  <Textarea placeholder="Digite sua mensagem..." rows={3} />
                </FormField>
                <FormField label="País">
                  <SelectNative>
                    <SelectOption value="">Selecione...</SelectOption>
                    <SelectOption value="br">Brasil</SelectOption>
                    <SelectOption value="us">Estados Unidos</SelectOption>
                    <SelectOption value="pt">Portugal</SelectOption>
                  </SelectNative>
                </FormField>
              </div>
            </Surface>

            <Surface padding="lg">
              <Heading as="h3" size="sm" className="mb-4">Checkbox, Radio & Switch</Heading>
              <div className="space-y-6">
                <div className="space-y-3">
                  <LabelText size="xs" uppercase className="block">Checkbox</LabelText>
                  <Checkbox
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                    label="Aceito os termos de uso"
                  />
                  <Checkbox
                    checked={false}
                    onChange={() => {}}
                    label="Newsletter semanal"
                  />
                </div>

                <Divider />

                <div className="space-y-3">
                  <LabelText size="xs" uppercase className="block">Radio</LabelText>
                  <Radio
                    name="plan"
                    value="option1"
                    checked={radioValue === 'option1'}
                    onChange={(e) => setRadioValue(e.target.value)}
                    label="Plano Básico"
                  />
                  <Radio
                    name="plan"
                    value="option2"
                    checked={radioValue === 'option2'}
                    onChange={(e) => setRadioValue(e.target.value)}
                    label="Plano Pro"
                  />
                </div>

                <Divider />

                <div className="space-y-3">
                  <LabelText size="xs" uppercase className="block">Switch</LabelText>
                  <div className="flex items-center justify-between">
                    <Text size="sm">Notificações por email</Text>
                    <Switch checked={switchChecked} onChange={(e) => setSwitchChecked(e.target.checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Text size="sm">Modo escuro</Text>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                </div>
              </div>
            </Surface>
          </div>
        </section>

        {/* ================================================================
            DATA DISPLAY
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Data Display</Heading>

          <div className="space-y-6">
            {/* Cards */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Cards</LabelText>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Default</CardTitle>
                    <CardDescription>Descrição do card</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Text size="sm" variant="muted">Conteúdo do card aqui.</Text>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Card Elevated</CardTitle>
                    <CardDescription>Com borda gradiente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Text size="sm" variant="muted">Estilo premium com gradient border.</Text>
                  </CardContent>
                </Card>

                <Card variant="accent">
                  <CardHeader>
                    <CardTitle>Card Accent</CardTitle>
                    <CardDescription>Destaque especial</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Text size="sm" variant="muted">Para informações importantes.</Text>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Stat Cards */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Stat Cards</LabelText>
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  label="Saldo disponível"
                  value="R$ 12.450,00"
                  icon={<Wallet className="size-4" />}
                />
                <StatCard
                  label="Recebido hoje"
                  value="R$ 3.280,00"
                  trend="up"
                  trendValue="+12.5%"
                  icon={<Zap className="size-4" />}
                />
                <StatCard
                  label="Transações"
                  value="47"
                  variant="accent"
                  icon={<CreditCard className="size-4" />}
                />
                <StatCard
                  label="Taxa média"
                  value="1.2%"
                  icon={<Star className="size-4" />}
                />
              </div>
            </div>

            {/* Badges */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Badges</LabelText>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            {/* IconBox */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Icon Box</LabelText>
              <div className="flex gap-4">
                <IconBox variant="default"><Home className="size-5" /></IconBox>
                <IconBox variant="accent"><Zap className="size-5" /></IconBox>
                <IconBox variant="success"><Check className="size-5" /></IconBox>
                <IconBox variant="warning"><Bell className="size-5" /></IconBox>
                <IconBox variant="error"><X className="size-5" /></IconBox>
                <IconBox variant="accent" shape="circle"><User className="size-5" /></IconBox>
              </div>
            </div>

            {/* Avatars */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Avatars</LabelText>
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <AvatarCustom name="João Silva" size="xs" />
                  <AvatarCustom name="Maria Costa" size="sm" />
                  <AvatarCustom name="Pedro Santos" size="default" />
                  <AvatarCustom name="Ana Lima" size="lg" variant="accent" />
                </div>
                <Divider orientation="vertical" className="h-12" />
                <AvatarGroup max={3}>
                  <AvatarCustom name="User 1" />
                  <AvatarCustom name="User 2" />
                  <AvatarCustom name="User 3" />
                  <AvatarCustom name="User 4" />
                  <AvatarCustom name="User 5" />
                </AvatarGroup>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            FEEDBACK
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Feedback</Heading>

          <div className="space-y-6">
            {/* Alerts */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Alerts</LabelText>
              <div className="space-y-3">
                <Alert variant="info" title="Informação">
                  Esta é uma mensagem informativa para o usuário.
                </Alert>
                <Alert variant="success" title="Sucesso!">
                  Operação realizada com sucesso.
                </Alert>
                <Alert variant="warning" title="Atenção">
                  Verifique os dados antes de continuar.
                </Alert>
                <Alert variant="error" title="Erro" dismissible>
                  Algo deu errado. Tente novamente.
                </Alert>
              </div>
            </div>

            {/* Tooltips */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Tooltips</LabelText>
              <div className="flex gap-4">
                <TooltipCustom content="Tooltip em cima" position="top">
                  <Button variant="outline" size="sm">Top</Button>
                </TooltipCustom>
                <TooltipCustom content="Tooltip embaixo" position="bottom">
                  <Button variant="outline" size="sm">Bottom</Button>
                </TooltipCustom>
                <TooltipCustom content="Tooltip à esquerda" position="left">
                  <Button variant="outline" size="sm">Left</Button>
                </TooltipCustom>
                <TooltipCustom content="Tooltip à direita" position="right">
                  <Button variant="outline" size="sm">Right</Button>
                </TooltipCustom>
              </div>
            </div>

            {/* Modal */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Modal</LabelText>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Abrir Modal
              </Button>
              <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalHeader
                  title="Título do Modal"
                  description="Descrição opcional do modal aqui."
                />
                <ModalContent>
                  <Text variant="muted">
                    Conteúdo do modal. Pode conter formulários, informações, confirmações, etc.
                  </Text>
                </ModalContent>
                <ModalFooter>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                    Confirmar
                  </Button>
                </ModalFooter>
              </Modal>
            </div>

            {/* Skeletons */}
            <div>
              <LabelText size="xs" uppercase className="mb-3 block">Skeletons</LabelText>
              <div className="grid grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonListItem />
                <div className="space-y-2">
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            NAVIGATION
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Navigation</Heading>

          <Surface padding="lg">
            <LabelText size="xs" uppercase className="mb-3 block">Tabs</LabelText>
            <Tabs defaultValue="tab1" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tab1">Geral</TabsTrigger>
                <TabsTrigger value="tab2">Segurança</TabsTrigger>
                <TabsTrigger value="tab3">Notificações</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <Text variant="muted">Conteúdo da aba Geral.</Text>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <Text variant="muted">Conteúdo da aba Segurança.</Text>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <Text variant="muted">Conteúdo da aba Notificações.</Text>
              </TabsContent>
            </Tabs>
          </Surface>
        </section>

        {/* ================================================================
            PAGE STRUCTURE
        ================================================================ */}
        <section className="mb-16">
          <Heading as="h2" size="lg" className="mb-6">Page Structure</Heading>

          <div className="space-y-6">
            {/* Page Header */}
            <Surface padding="lg">
              <LabelText size="xs" uppercase className="mb-3 block">Page Header</LabelText>
              <PageHeader
                kicker="Bom dia, João"
                title="Dashboard"
                description="Aqui está o resumo da sua conta"
                actions={
                  <Button variant="primary" size="sm">
                    <Plus className="size-4" />
                    Nova ação
                  </Button>
                }
              />
            </Surface>

            {/* Empty State */}
            <Surface padding="lg">
              <LabelText size="xs" uppercase className="mb-3 block">Empty State</LabelText>
              <EmptyState
                icon={<Search className="size-6" />}
                title="Nenhum resultado"
                description="Não encontramos nada com esses filtros. Tente uma busca diferente."
                action={
                  <Button variant="outline" size="sm">
                    Limpar filtros
                  </Button>
                }
              />
            </Surface>

            {/* Section */}
            <Surface padding="lg">
              <LabelText size="xs" uppercase className="mb-3 block">Section</LabelText>
              <Section
                title="Últimas transações"
                description="Suas transações mais recentes"
                actions={
                  <Button variant="ghost" size="sm">
                    Ver todas
                    <ChevronRight className="size-4" />
                  </Button>
                }
              >
                <ListItem
                  icon={<Zap className="size-4 text-green-400" />}
                  title="Pagamento recebido"
                  description="De: cliente@email.com"
                  trailing={<span className="text-green-400">+R$ 150,00</span>}
                />
                <ListItem
                  icon={<CreditCard className="size-4 text-red-400" />}
                  title="Transferência enviada"
                  description="Para: fornecedor@email.com"
                  trailing={<span className="text-red-400">-R$ 500,00</span>}
                />
              </Section>
            </Surface>
          </div>
        </section>

        {/* Footer */}
        <Divider variant="fade" spacing="lg" />
        <div className="text-center py-8">
          <Text variant="muted" size="sm">
            Nocturne Design System v1.0 — Flyerx
          </Text>
        </div>
      </Container>
    </div>
  )
}
