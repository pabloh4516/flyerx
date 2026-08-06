'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import {
  Button,
  Container,
  Badge,
  Skeleton,
  SkeletonListItem,
  EmptyState,
  Alert,
  DataRow,
  DataRowGroup,
} from '@/components/ui';
import { useTransactions } from '@/hooks/use-queries';
import type { Transaction, TransactionStatus, TransactionType } from '@/types';
import { toast } from 'sonner';

// ===== Tipos =====
type FilterType = 'all' | 'received' | 'sent';

// Tipagem extendida para transações com campos opcionais
interface ExtendedTransaction extends Transaction {
  payerName?: string;
  payerTaxNumber?: string;
  pixKey?: string;
  pixKeyType?: string;
  recipientName?: string;
  recipientDocument?: string;
  endToEndId?: string;
  receiptUrl?: string;
  liquidAddress?: string;
}

// ===== Configuração de Status =====
const statusConfig: Record<TransactionStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  COMPLETED: { label: 'Concluído', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  AWAITING_PAYMENT: { label: 'Aguardando', variant: 'warning' },
  PROCESSING: { label: 'Processando', variant: 'warning' },
  UNDER_REVIEW: { label: 'Em análise', variant: 'warning' },
  DELAYED: { label: 'Aguardando processamento', variant: 'warning' },
  FAILED: { label: 'Falhou', variant: 'error' },
  CANCELLED: { label: 'Cancelado', variant: 'neutral' },
  EXPIRED: { label: 'Expirado', variant: 'neutral' },
  REFUNDED: { label: 'Devolvido', variant: 'neutral' },
  REJECTED: { label: 'Rejeitado', variant: 'error' },
};

// ===== Helpers =====
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateId(id: string, chars = 8): string {
  if (id.length <= chars * 2) return id;
  return `${id.slice(0, chars)}...${id.slice(-chars)}`;
}

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error('Falha ao copiar');
  }
}

// ===== Componente de Linha Expandível =====
function TransactionRow({ tx, isExpanded, onToggle }: {
  tx: ExtendedTransaction;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isDeposit = tx.type === 'DEPOSIT';
  const config = statusConfig[tx.status] || { label: tx.status, variant: 'neutral' as const };

  return (
    <div className="border-b border-divider">
      {/* Linha principal */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-neutral-900/30 transition-colors text-left"
      >
        {/* Ícone de tipo */}
        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
          isDeposit
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {isDeposit ? (
            <ArrowDownLeft className="size-4 text-green-400" />
          ) : (
            <ArrowUpRight className="size-4 text-red-400" />
          )}
        </div>

        {/* Descrição e ID */}
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">
            {tx.description || (isDeposit ? 'Depósito PIX' : 'Saque PIX')}
          </p>
          <p className="text-xs text-neutral-600 font-mono">
            #{truncateId(tx.id, 6)}
          </p>
        </div>

        {/* Valor */}
        <div className="text-right shrink-0">
          <span className={`text-sm font-medium tabular-nums ${
            isDeposit ? 'text-green-400' : 'text-red-400'
          }`}>
            {isDeposit ? '+' : '-'}{formatCurrency(tx.amount)}
          </span>
        </div>

        {/* Status */}
        <div className="shrink-0 w-28">
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
        </div>

        {/* Data */}
        <span className="text-xs text-neutral-500 tabular-nums shrink-0 w-24 text-right">
          {formatDateShort(tx.createdAt)}
        </span>

        {/* Chevron */}
        <ChevronDown className={`size-4 text-neutral-500 shrink-0 transition-transform ${
          isExpanded ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Painel Expandido */}
      {isExpanded && (
        <div className="px-4 py-4 bg-neutral-900/20 border-t border-divider/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Valores */}
            <DataRowGroup title="Valores" noBorderLast>
              <DataRow
                label="Valor bruto"
                value={formatCurrency(tx.amount)}
                size="sm"
              />
              <DataRow
                label="Taxa"
                value={tx.fee > 0 ? formatCurrency(tx.fee) : 'Grátis'}
                size="sm"
              />
              <DataRow
                label="Valor líquido"
                value={formatCurrency(tx.netAmount)}
                accent
                size="sm"
              />
            </DataRowGroup>

            {/* Coluna 2: Identificadores */}
            <DataRowGroup title="Identificadores" noBorderLast>
              <DataRow
                label="ID da transação"
                value={truncateId(tx.id, 10)}
                mono
                size="sm"
                action={
                  <button
                    onClick={() => copyToClipboard(tx.id, 'ID')}
                    className="p-1 hover:bg-neutral-800 rounded transition-colors"
                  >
                    <Copy className="size-3.5 text-neutral-500" />
                  </button>
                }
              />

              {/* Endereço Liquid (saques) */}
              {!isDeposit && tx.liquidAddress && (
                <DataRow
                  label="Endereço Liquid"
                  value={truncateId(tx.liquidAddress, 8)}
                  mono
                  size="sm"
                  action={
                    <button
                      onClick={() => copyToClipboard(tx.liquidAddress!, 'Endereço')}
                      className="p-1 hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Copy className="size-3.5 text-neutral-500" />
                    </button>
                  }
                />
              )}

              {/* E2E ID (saques concluídos) */}
              {!isDeposit && tx.endToEndId && (
                <DataRow
                  label="E2E ID"
                  value={truncateId(tx.endToEndId, 8)}
                  mono
                  size="sm"
                  action={
                    <button
                      onClick={() => copyToClipboard(tx.endToEndId!, 'E2E ID')}
                      className="p-1 hover:bg-neutral-800 rounded transition-colors"
                    >
                      <Copy className="size-3.5 text-neutral-500" />
                    </button>
                  }
                />
              )}

              {/* Pagador (depósitos) */}
              {isDeposit && tx.payerName && (
                <DataRow
                  label="Pagador"
                  value={tx.payerName}
                  size="sm"
                />
              )}

              {/* CPF/CNPJ do pagador (depósitos) */}
              {isDeposit && tx.payerTaxNumber && (
                <DataRow
                  label="CPF/CNPJ"
                  value={tx.payerTaxNumber}
                  mono
                  size="sm"
                />
              )}

              {/* Destinatário (saques) */}
              {!isDeposit && tx.recipientName && (
                <DataRow
                  label="Destinatário"
                  value={tx.recipientName}
                  size="sm"
                />
              )}

              {/* Chave PIX (saques) */}
              {!isDeposit && tx.pixKey && (
                <DataRow
                  label="Chave PIX"
                  value={tx.pixKey}
                  mono
                  size="sm"
                />
              )}
            </DataRowGroup>
          </div>

          {/* Comprovante (se disponível) */}
          {tx.receiptUrl && (
            <div className="mt-4 pt-4 border-t border-divider">
              <a
                href={tx.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="size-4" />
                Ver comprovante
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Loading State =====
function LoadingState() {
  return (
    <div className="border border-divider rounded-xl overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

// ===== Erro State =====
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="error" className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="size-5" />
        <div>
          <p className="font-medium">Erro ao carregar transações</p>
          <p className="text-sm text-neutral-400">Não foi possível carregar o histórico. Tente novamente.</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="size-3.5" />
        Tentar novamente
      </Button>
    </Alert>
  );
}

// ===== Página Principal =====
export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filtro de tipo para a API
  const typeFilter: TransactionType | undefined =
    filter === 'received' ? 'DEPOSIT' :
    filter === 'sent' ? 'WITHDRAWAL' :
    undefined;

  // Query de transações
  const { data, isLoading, isError, refetch } = useTransactions({
    page,
    limit,
    type: typeFilter,
  });

  // Transações filtradas localmente (busca)
  const filteredTransactions = useMemo(() => {
    if (!data?.data) return [];

    if (!searchQuery) return data.data;

    const q = searchQuery.toLowerCase();
    return data.data.filter((tx) => {
      const extTx = tx as ExtendedTransaction;
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q) ||
        extTx.pixKey?.toLowerCase().includes(q) ||
        extTx.payerName?.toLowerCase().includes(q) ||
        extTx.recipientName?.toLowerCase().includes(q)
      );
    });
  }, [data?.data, searchQuery]);

  // Totais calculados
  const totals = useMemo(() => {
    if (!data?.data) return { received: 0, sent: 0 };

    return {
      received: data.data
        .filter((tx) => tx.type === 'DEPOSIT' && tx.status === 'COMPLETED')
        .reduce((acc, tx) => acc + tx.netAmount, 0),
      sent: data.data
        .filter((tx) => tx.type === 'WITHDRAWAL' && tx.status === 'COMPLETED')
        .reduce((acc, tx) => acc + tx.amount, 0),
    };
  }, [data?.data]);

  // Meta de paginação
  const meta = data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Toggle expansão
  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Extrato</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Histórico de transações da sua conta
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-divider bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <ArrowDownLeft className="size-4 text-green-400" />
            </div>
            <span className="text-xs text-neutral-500">Total recebido</span>
          </div>
          {isLoading ? (
            <Skeleton width={120} height={28} />
          ) : (
            <p className="text-xl font-semibold text-green-400">{formatCurrency(totals.received)}</p>
          )}
        </div>

        <div className="rounded-xl border border-divider bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ArrowUpRight className="size-4 text-red-400" />
            </div>
            <span className="text-xs text-neutral-500">Total enviado</span>
          </div>
          {isLoading ? (
            <Skeleton width={120} height={28} />
          ) : (
            <p className="text-xl font-semibold text-red-400">{formatCurrency(totals.sent)}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 border border-divider rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="size-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por ID ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-neutral-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 border border-divider rounded-lg p-0.5">
          {(['all', 'received', 'sent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1); // Reset página ao mudar filtro
              }}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                filter === f
                  ? 'bg-accent/20 text-accent-200'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {f === 'all' && 'Todas'}
              {f === 'received' && 'Entradas'}
              {f === 'sent' && 'Saídas'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredTransactions.length === 0 ? (
        <div className="border border-divider rounded-xl">
          <EmptyState
            icon={<FileText className="size-6" />}
            title="Nenhuma transação encontrada"
            description={
              searchQuery
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Suas transações aparecerão aqui assim que você receber ou enviar PIX.'
            }
          />
        </div>
      ) : (
        <div className="border border-divider rounded-xl overflow-hidden">
          {filteredTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx as ExtendedTransaction}
              isExpanded={expandedId === tx.id}
              onToggle={() => handleToggle(tx.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && meta.totalPages > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Mostrando {filteredTransactions.length} de {meta.total} transações
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-divider rounded-lg text-xs text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-3" />
              Anterior
            </button>
            <span className="text-xs text-neutral-400 px-3">
              Página {meta.page} de {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-divider rounded-lg text-xs text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Próxima
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      )}
    </Container>
  );
}
