'use client';

import { useState } from 'react';
import {
  Plus,
  Link2,
  Copy,
  Check,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, Container } from '@/components/ui';

interface PaymentLink {
  id: string;
  name: string;
  amount: number | null; // null = valor aberto
  url: string;
  uses: number;
  totalReceived: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// TODO: Integrar com API quando o endpoint estiver disponível
const paymentLinks: PaymentLink[] = [];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function PaymentLinksPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Link copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const activeLinks = paymentLinks.filter((l) => l.status === 'active').length;
  const totalReceived = paymentLinks.reduce((acc, l) => acc + l.totalReceived, 0);

  return (
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Links de Pagamento</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Crie e gerencie links para receber pagamentos
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="size-4" />
          Novo link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-divider bg-surface p-4">
          <p className="text-xs text-neutral-500 mb-1">Links ativos</p>
          <p className="text-2xl font-semibold">{activeLinks}</p>
        </div>
        <div className="rounded-xl border border-divider bg-surface p-4">
          <p className="text-xs text-neutral-500 mb-1">Total de usos</p>
          <p className="text-2xl font-semibold">{paymentLinks.reduce((acc, l) => acc + l.uses, 0)}</p>
        </div>
        <div className="rounded-xl border border-divider bg-surface p-4">
          <p className="text-xs text-neutral-500 mb-1">Total recebido</p>
          <p className="text-2xl font-semibold text-green-400">{formatCurrency(totalReceived)}</p>
        </div>
      </div>

      {/* Links Grid */}
      <div className="grid gap-4">
        {paymentLinks.map((link) => (
          <div
            key={link.id}
            className={`rounded-xl border bg-surface p-4 transition-colors ${
              link.status === 'active' ? 'border-divider' : 'border-divider/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <Link2 className="size-5 text-accent-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{link.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      link.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}>
                      {link.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {link.amount ? formatCurrency(link.amount) : 'Valor aberto'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(link.url, link.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-divider text-xs text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                >
                  {copiedId === link.id ? (
                    <Check className="size-3.5 text-green-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copiar
                </button>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === link.id ? null : link.id)}
                    className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  >
                    <MoreVertical className="size-4" />
                  </button>

                  {menuOpen === link.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-divider rounded-lg shadow-lg z-50 py-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                          <ExternalLink className="size-3.5" />
                          Abrir link
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                          <QrCode className="size-3.5" />
                          Ver QR Code
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                          <Edit className="size-3.5" />
                          Editar
                        </button>
                        <div className="border-t border-divider my-1" />
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-900">
                          <Trash2 className="size-3.5" />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-divider flex items-center gap-6">
              <div>
                <p className="text-[10px] text-neutral-600">URL</p>
                <p className="text-xs text-neutral-400 font-mono">{link.url}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-600">Usos</p>
                <p className="text-xs text-neutral-300">{link.uses}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-600">Total recebido</p>
                <p className="text-xs text-green-400">{formatCurrency(link.totalReceived)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
