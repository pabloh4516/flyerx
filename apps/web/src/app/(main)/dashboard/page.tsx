'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Link2,
  Users,
  ChevronRight,
  Eye,
  ShieldCheck,
  QrCode,
  Copy,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, Card, Badge, Container } from '@/components/ui';
import { TransactionIcon, Sparkline, Logo } from '@/components/ui/nocturne';

import { useAuthStore } from '@/stores/auth';
import { useBalance, useTransactions } from '@/hooks/use-queries';
import { formatCurrency } from '@/lib/validations/transactions';
import { cn } from '@/lib/utils';
import type { TransactionStatus, TransactionType } from '@/types';

const txTypeToIcon = (type: TransactionType): 'in' | 'out' => {
  return type === 'DEPOSIT' ? 'in' : 'out';
};

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

const quickActions: QuickAction[] = [
  {
    href: '/receive',
    label: 'Receber PIX',
    description: 'QR dinâmico ou chave',
    icon: ArrowDownLeft,
    accent: true,
  },
  {
    href: '/send',
    label: 'Enviar PIX',
    description: 'Para qualquer chave',
    icon: ArrowUpRight,
  },
  {
    href: '/payment-links',
    label: 'Link de pagamento',
    description: 'Crie e compartilhe',
    icon: Link2,
  },
  {
    href: '/subaccounts',
    label: 'Subcontas',
    description: '3 membros ativos',
    icon: Users,
  },
];

const statusBadge: Record<TransactionStatus, { label: string; variant: 'default' | 'accent' | 'outline' }> = {
  COMPLETED: { label: 'Confirmado', variant: 'accent' },
  PENDING: { label: 'Pendente', variant: 'outline' },
  AWAITING_PAYMENT: { label: 'Aguardando', variant: 'outline' },
  PROCESSING: { label: 'Processando', variant: 'outline' },
  UNDER_REVIEW: { label: 'Em análise', variant: 'outline' },
  DELAYED: { label: 'Aguardando', variant: 'outline' },
  FAILED: { label: 'Falhou', variant: 'default' },
  CANCELLED: { label: 'Cancelado', variant: 'default' },
  EXPIRED: { label: 'Expirado', variant: 'default' },
  REFUNDED: { label: 'Devolvido', variant: 'default' },
  REJECTED: { label: 'Rejeitado', variant: 'default' },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getDateString(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function SellerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: balance } = useBalance();
  const { data: transactionsData } = useTransactions({ limit: 3 });

  const transactions = transactionsData?.data ?? [];

  const userName = user?.name?.split(' ')[0] ?? 'Usuário';
  const isVerified = user?.kycLevel === 'VERIFIED' || user?.kycLevel === 'FULL';

  // Mock data for today's summary
  const todayIncome = 4820;
  const todayOutcome = 1648;
  const weekGrowth = 3172;

  const handleCopyLink = async () => {
    const link = `pix.flyerx.cc/${userName.toLowerCase()}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  return (
    <Container size="lg" padded={false} className="p-7 flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">{getGreeting()},</span>
          <div className="flex items-center gap-3">
            <span className="text-xl font-medium tracking-tight">{userName}</span>
            {isVerified && (
              <span className="flex items-center gap-1.5 text-xs text-accent-300">
                <ShieldCheck className="size-3.5" />
                Conta verificada
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-neutral-600">
          {getDateString()} · atualizado agora
        </span>
      </div>

      {/* Balance & PIX Key cards */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        {/* Balance card */}
        <div className="relative border border-transparent rounded-lg p-6 flex flex-col gap-5 shadow-[0_24px_48px_rgba(0,0,0,0.35)] bg-[linear-gradient(color-mix(in_srgb,var(--color-surface)_76%,transparent),color-mix(in_srgb,var(--color-surface)_76%,transparent))_padding-box,linear-gradient(130deg,var(--color-accent-700),var(--color-neutral-800)_55%,var(--color-neutral-900))_border-box]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-neutral-500 flex items-center gap-2">
                Saldo disponível
                <Eye className="size-3.5 text-neutral-600" />
              </span>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-base text-neutral-500">R$</span>
                <span className="text-5xl font-medium tracking-tight leading-none">
                  {Math.floor(balance?.available ?? 24318).toLocaleString('pt-BR')}
                  <span className="text-2xl text-neutral-400">
                    ,{String((balance?.available ?? 24318.72) % 1).slice(2, 4).padEnd(2, '0')}
                  </span>
                </span>
              </div>
              <span className="text-xs text-accent-300 flex items-center gap-1.5">
                <TrendingUp className="size-3" />
                + R$ {weekGrowth.toLocaleString('pt-BR')},00 esta semana
              </span>
            </div>

            {/* Sparkline */}
            <Sparkline
              data={[56, 50, 52, 40, 44, 24, 14]}
              width={180}
              height={72}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[linear-gradient(to_right,transparent,var(--color-divider)_15%,var(--color-divider)_85%,transparent)]" />

          {/* Summary */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                Entradas · hoje
              </span>
              <span className="text-base font-medium text-accent-200 tabular-nums">
                R$ {todayIncome.toLocaleString('pt-BR')},00
              </span>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                Saídas · hoje
              </span>
              <span className="text-base font-medium tabular-nums">
                R$ {todayOutcome.toLocaleString('pt-BR')},00
              </span>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                Pendências
              </span>
              <span className="text-base font-medium text-neutral-500">Nenhuma</span>
            </div>

            <Link href="/history" className="ml-auto">
              <Button variant="secondary" size="sm">
                Ver extrato completo →
              </Button>
            </Link>
          </div>
        </div>

        {/* PIX Key card */}
        <Card className="p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-2">
              <QrCode className="size-3.5 text-accent-300" />
              Chave PIX Fixa
            </span>
            <Badge variant="accent">Ativa</Badge>
          </div>

          <div className="flex gap-3.5 items-center">
            {/* QR Code placeholder */}
            <div className="w-[74px] h-[74px] rounded-md bg-neutral-100 p-1.5 flex-shrink-0 flex items-center justify-center">
              <Logo size="lg" className="opacity-50" />
            </div>

            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">
                  pix.flyerx.cc/{userName.toLowerCase()}
                </span>
                <span className="text-[10px] text-neutral-600">
                  recebeu 12 pagamentos esta semana
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs px-3 py-1"
                  onClick={handleCopyLink}
                >
                  <Copy className="size-3" />
                  Copiar link
                </Button>
                <Button variant="secondary" size="sm" className="text-xs px-3 py-1">
                  QR
                </Button>
              </div>
            </div>
          </div>

          <div className="h-px bg-[linear-gradient(to_right,transparent,var(--color-divider)_20%,var(--color-divider)_80%,transparent)]" />

          <div className="flex justify-between text-xs text-neutral-600">
            <span>2 chaves cadastradas</span>
            <Link href="/pix-keys" className="text-accent-300 hover:underline">
              Gerenciar chaves →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="border border-border rounded-md p-3.5 flex items-center gap-3 bg-[color-mix(in_srgb,var(--color-surface)_45%,transparent)] hover:border-neutral-700 transition-colors group"
          >
            <div
              className={cn(
                'size-10 rounded-md flex items-center justify-center flex-shrink-0',
                action.accent
                  ? 'border border-accent bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] text-accent-300'
                  : 'border border-border text-neutral-300'
              )}
            >
              <action.icon className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-[10px] text-neutral-600">{action.description}</span>
            </div>
            <ChevronRight className="size-4 text-neutral-700 ml-auto flex-shrink-0 group-hover:text-neutral-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <Card className="p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border">
          <span className="text-sm font-medium">Última atividade</span>
          <div className="flex gap-1.5 ml-2.5">
            <Badge variant="accent">Tudo</Badge>
            <Badge variant="outline">Entradas</Badge>
            <Badge variant="outline">Saídas</Badge>
          </div>
          <Link
            href="/history"
            className="ml-auto text-xs text-accent-300 hover:underline"
          >
            Ver tudo →
          </Link>
        </div>

        {/* Transactions */}
        {transactions.length > 0 ? (
          transactions.map((tx, index) => (
            <Link
              key={tx.id}
              href={`/receipt/${tx.id}`}
              className={cn(
                'flex items-center gap-3.5 px-5 py-3 hover:bg-neutral-900/30 transition-colors',
                index < transactions.length - 1 && 'border-b border-border'
              )}
            >
              <TransactionIcon type={txTypeToIcon(tx.type)} />

              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-sm">
                  {tx.type === 'DEPOSIT' ? 'Depósito PIX recebido' : 'Saque PIX'}
                  {tx.description && ` · ${tx.description}`}
                </span>
                <span className="text-xs text-neutral-600 font-mono">
                  {new Date(tx.createdAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  {new Date(tx.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {tx.fee > 0 && ` · taxa ${formatCurrency(tx.fee)}`}
                  {' · '}
                  {tx.id.slice(0, 12)}
                </span>
              </div>

              <Badge variant={statusBadge[tx.status].variant}>
                {statusBadge[tx.status].label}
              </Badge>

              <span
                className={cn(
                  'text-sm tabular-nums w-[110px] text-right',
                  tx.type === 'DEPOSIT' ? 'text-accent-300' : ''
                )}
              >
                {tx.type === 'DEPOSIT' ? '+' : '−'} {formatCurrency(tx.amount)}
              </span>
            </Link>
          ))
        ) : (
          <div className="px-5 py-8 text-center text-sm text-neutral-500">
            Nenhuma transação encontrada
          </div>
        )}
      </Card>

      {/* Footer */}
      <div className="flex justify-between items-center pt-1 text-xs text-neutral-600 mt-auto">
        <span>© 2026 Flyerx</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-neutral-400">
            Privacidade
          </Link>
          <Link href="/terms" className="hover:text-neutral-400">
            Termos
          </Link>
        </div>
      </div>
    </Container>
  );
}
