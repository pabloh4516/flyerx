'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

import { Button, Container, Badge } from '@/components/ui';

type TransactionType = 'all' | 'received' | 'sent';
type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: TransactionStatus;
  amount: number;
  fee: number;
  netAmount: number;
  description: string;
  pixKey?: string;
  createdAt: string;
}

const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 1500.00,
    fee: 1.50,
    netAmount: 1498.50,
    description: 'Pagamento recebido',
    pixKey: 'cliente@email.com',
    createdAt: '2026-08-05T14:32:00Z',
  },
  {
    id: 'tx_002',
    type: 'WITHDRAWAL',
    status: 'COMPLETED',
    amount: 500.00,
    fee: 2.00,
    netAmount: 498.00,
    description: 'Transferência enviada',
    pixKey: '11999887766',
    createdAt: '2026-08-05T11:15:00Z',
  },
  {
    id: 'tx_003',
    type: 'DEPOSIT',
    status: 'PENDING',
    amount: 250.00,
    fee: 0.25,
    netAmount: 249.75,
    description: 'Aguardando confirmação',
    pixKey: '12345678901',
    createdAt: '2026-08-05T10:45:00Z',
  },
  {
    id: 'tx_004',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 3200.00,
    fee: 3.20,
    netAmount: 3196.80,
    description: 'Pagamento recebido',
    pixKey: 'empresa@cnpj.com',
    createdAt: '2026-08-04T16:20:00Z',
  },
  {
    id: 'tx_005',
    type: 'WITHDRAWAL',
    status: 'FAILED',
    amount: 100.00,
    fee: 0,
    netAmount: 0,
    description: 'Chave PIX inválida',
    pixKey: 'invalido@teste',
    createdAt: '2026-08-04T14:00:00Z',
  },
  {
    id: 'tx_006',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 890.00,
    fee: 0.89,
    netAmount: 889.11,
    description: 'Pagamento recebido',
    pixKey: 'pagador@mail.com',
    createdAt: '2026-08-04T09:30:00Z',
  },
];

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

const statusConfig: Record<TransactionStatus, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  COMPLETED: { label: 'Concluído', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  FAILED: { label: 'Falhou', variant: 'error' },
};

export default function SellerHistoryPage() {
  const [filter, setFilter] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (filter === 'received' && tx.type !== 'DEPOSIT') return false;
    if (filter === 'sent' && tx.type !== 'WITHDRAWAL') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.pixKey?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totals = {
    received: mockTransactions
      .filter((tx) => tx.type === 'DEPOSIT' && tx.status === 'COMPLETED')
      .reduce((acc, tx) => acc + tx.netAmount, 0),
    sent: mockTransactions
      .filter((tx) => tx.type === 'WITHDRAWAL' && tx.status === 'COMPLETED')
      .reduce((acc, tx) => acc + tx.amount, 0),
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-3.5" />
            Últimos 30 dias
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-3.5" />
            Exportar
          </Button>
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
          <p className="text-xl font-semibold text-green-400">{formatCurrency(totals.received)}</p>
        </div>

        <div className="rounded-xl border border-divider bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <ArrowUpRight className="size-4 text-red-400" />
            </div>
            <span className="text-xs text-neutral-500">Total enviado</span>
          </div>
          <p className="text-xl font-semibold text-red-400">{formatCurrency(totals.sent)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-divider rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="size-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por ID, descrição ou chave PIX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-neutral-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 border border-divider rounded-lg p-0.5">
          {(['all', 'received', 'sent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                filter === f
                  ? 'bg-accent/20 text-accent-200'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {f === 'all' && 'Todas'}
              {f === 'received' && 'Recebidas'}
              {f === 'sent' && 'Enviadas'}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-3.5" />
          Filtros
        </Button>
      </div>

      {/* Table */}
      <div className="border border-divider rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface/50 border-b border-divider">
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                Descrição
              </th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                Chave PIX
              </th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                Valor
              </th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                Data
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-neutral-900/30 transition-colors">
                <td className="px-4 py-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'DEPOSIT'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    {tx.type === 'DEPOSIT' ? (
                      <ArrowDownLeft className="size-4 text-green-400" />
                    ) : (
                      <ArrowUpRight className="size-4 text-red-400" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm">{tx.description}</p>
                    <p className="text-[10px] text-neutral-600">#{tx.id}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-neutral-400 font-mono">
                    {tx.pixKey || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium tabular-nums ${
                    tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  {tx.fee > 0 && (
                    <p className="text-[10px] text-neutral-600">
                      Taxa: {formatCurrency(tx.fee)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusConfig[tx.status].variant}>
                    {statusConfig[tx.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {formatDate(tx.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          Mostrando {filteredTransactions.length} de {mockTransactions.length} transações
        </span>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 border border-divider rounded-lg text-xs text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors disabled:opacity-50" disabled>
            <ChevronLeft className="size-3" />
            Anterior
          </button>
          <span className="text-xs text-neutral-400 px-3">Página 1 de 1</span>
          <button className="flex items-center gap-1 px-3 py-1.5 border border-divider rounded-lg text-xs text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors disabled:opacity-50" disabled>
            Próxima
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
    </Container>
  );
}
