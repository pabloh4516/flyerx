'use client';

import * as React from 'react';
import { Check, Copy, Download, QrCode, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Logo } from './nocturne';
import { toast } from 'sonner';

/**
 * TransactionReceipt — Nocturne Design System
 *
 * Comprovante de transação estilizado para depósitos e saques.
 * Pode ser usado para exibição na tela e exportação como imagem/PDF.
 */

export interface TransactionReceiptProps {
  /** Tipo da transação */
  type: 'deposit' | 'withdraw';
  /** Status da transação */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  /** ID da transação */
  id: string;
  /** Valor bruto em reais */
  amountGross: number;
  /** Taxa total */
  fee: number;
  /** Valor líquido (recebido ou enviado) */
  amountNet: number;
  /** Data/hora da transação */
  timestamp: Date;
  /** CPF/CNPJ do pagador (depósito) ou destinatário (saque) */
  taxDocument?: string;
  /** Chave PIX (para saques) */
  pixKey?: string;
  /** Endereço da carteira */
  walletAddress?: string;
  /** Hash da transação blockchain */
  blockchainTxId?: string;
  /** Mostrar ações (copiar, baixar) */
  showActions?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-700/50',
  },
  processing: {
    label: 'Processando',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700/50',
  },
  completed: {
    label: 'Confirmado',
    color: 'text-accent-300',
    bgColor: 'bg-accent-900/20',
    borderColor: 'border-accent-700/50',
  },
  failed: {
    label: 'Falhou',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/50',
  },
  expired: {
    label: 'Expirado',
    color: 'text-neutral-400',
    bgColor: 'bg-neutral-800/50',
    borderColor: 'border-neutral-700',
  },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const maskDocument = (doc: string) => {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.***.***.${clean.slice(-2)}`;
  }
  if (clean.length === 14) {
    return `${clean.slice(0, 2)}.***.***/****-${clean.slice(-2)}`;
  }
  return doc;
};

const truncateAddress = (address: string, chars = 8) => {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export function TransactionReceipt({
  type,
  status,
  id,
  amountGross,
  fee,
  amountNet,
  timestamp,
  taxDocument,
  pixKey,
  walletAddress,
  blockchainTxId,
  showActions = true,
  className,
}: TransactionReceiptProps) {
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const statusInfo = statusConfig[status];

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    toast.success('ID copiado!');
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      // Importar html2canvas dinamicamente
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `comprovante-${id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Comprovante baixado!');
    } catch (error) {
      toast.error('Erro ao gerar comprovante');
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Receipt Card */}
      <div
        ref={receiptRef}
        className="p-6 rounded-xl bg-gradient-to-b from-neutral-900 to-background border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'size-10 rounded-lg flex items-center justify-center',
                type === 'deposit' ? 'bg-accent-900/30' : 'bg-primary/20'
              )}
            >
              {type === 'deposit' ? (
                <ArrowDownLeft className="size-5 text-accent-300" />
              ) : (
                <ArrowUpRight className="size-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {type === 'deposit' ? 'Depósito PIX' : 'Saque PIX'}
              </p>
              <p className="text-xs text-neutral-500">{formatDate(timestamp)}</p>
            </div>
          </div>
          <Logo size="sm" />
        </div>

        {/* Status */}
        <div className="flex justify-center py-4">
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full border',
              statusInfo.bgColor,
              statusInfo.borderColor
            )}
          >
            {status === 'completed' && <Check className="size-4" />}
            <span className={cn('text-sm font-medium', statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
            {type === 'deposit' ? 'Você recebeu' : 'Você enviou'}
          </p>
          <p className="text-3xl font-bold text-accent-200 tabular-nums">
            {formatCurrency(amountNet)}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 py-4 border-t border-border">
          {/* Gross amount */}
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Valor bruto</span>
            <span className="text-neutral-300 tabular-nums">{formatCurrency(amountGross)}</span>
          </div>

          {/* Fee */}
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Taxa</span>
            <span className="text-neutral-400 tabular-nums">- {formatCurrency(fee)}</span>
          </div>

          {/* Net amount */}
          <div className="flex justify-between text-sm font-medium">
            <span className="text-neutral-300">
              {type === 'deposit' ? 'Valor líquido' : 'Total enviado'}
            </span>
            <span className="text-accent-200 tabular-nums">{formatCurrency(amountNet)}</span>
          </div>
        </div>

        {/* Transaction info */}
        <div className="space-y-2.5 py-4 border-t border-border">
          {/* ID */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-500">ID da transação</span>
            <span className="font-mono text-neutral-400">{id}</span>
          </div>

          {/* Document */}
          {taxDocument && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">
                {type === 'deposit' ? 'CPF/CNPJ pagador' : 'CPF/CNPJ destinatário'}
              </span>
              <span className="font-mono text-neutral-400">{maskDocument(taxDocument)}</span>
            </div>
          )}

          {/* PIX Key */}
          {pixKey && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">Chave PIX</span>
              <span className="font-mono text-neutral-400">{pixKey}</span>
            </div>
          )}

          {/* Wallet */}
          {walletAddress && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">Carteira</span>
              <span className="font-mono text-neutral-400">{truncateAddress(walletAddress)}</span>
            </div>
          )}

          {/* Blockchain TX */}
          {blockchainTxId && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500">TX Blockchain</span>
              <span className="font-mono text-neutral-400">{truncateAddress(blockchainTxId)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-[10px] text-neutral-600">
            Flyerx • {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleCopyId}>
            <Copy className="size-4" />
            Copiar ID
          </Button>
          <Button variant="primary" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="size-4" />
            Baixar comprovante
          </Button>
        </div>
      )}
    </div>
  );
}
