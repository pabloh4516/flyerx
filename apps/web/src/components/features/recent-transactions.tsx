'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { TransactionIcon, Divider } from '@/components/ui/nocturne';
import { Skeleton } from '@/components/ui';
import { formatCurrency } from '@/lib/validations/transactions';
import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let dayLabel: string;
    if (diffDays === 0) {
      dayLabel = 'Hoje';
    } else if (diffDays === 1) {
      dayLabel = 'Ontem';
    } else {
      dayLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dayLabel} · ${time}`;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      COMPLETED: 'concluído',
      PENDING: 'pendente',
      PROCESSING: 'processando',
      FAILED: 'falhou',
      CANCELLED: 'cancelado',
      EXPIRED: 'expirado',
    };
    return statusMap[status] || status.toLowerCase();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[13.5px] font-medium">Movimentações</span>
        <Link href="/history" className="text-[12px] text-accent-300 hover:underline">
          Ver extrato
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Skeleton className="size-[34px] rounded-[10px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[13px] text-neutral-500">Nenhuma movimentação ainda</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {transactions.map((transaction, index) => {
            const isDeposit = transaction.type === 'DEPOSIT';
            const isLast = index === transactions.length - 1;

            return (
              <div key={transaction.id}>
                <div className="flex items-center gap-3 py-2.5">
                  <TransactionIcon type={isDeposit ? 'in' : 'out'}>
                    {isDeposit ? (
                      <ArrowDown className="size-[15px]" strokeWidth={1.4} />
                    ) : (
                      <ArrowUp className="size-[15px]" strokeWidth={1.4} />
                    )}
                  </TransactionIcon>

                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-[13.5px]">
                      {isDeposit ? 'Depósito PIX' : 'Saque PIX'}
                    </span>
                    <span className="text-[11px] text-neutral-600">
                      {formatDate(transaction.createdAt)} · {getStatusLabel(transaction.status)}
                    </span>
                  </div>

                  <span className={cn(
                    "text-[13.5px] tabular-nums shrink-0",
                    isDeposit ? "text-accent-300" : "text-neutral-300"
                  )}>
                    {isDeposit ? '+' : '−'} {formatCurrency(transaction.amount)}
                  </span>
                </div>
                {!isLast && <Divider fade={false} className="bg-border" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
