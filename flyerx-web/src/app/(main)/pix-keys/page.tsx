'use client';

import { useState } from 'react';
import {
  Plus,
  Key,
  Copy,
  Check,
  Trash2,
  Mail,
  Phone,
  FileText,
  Hash,
  MoreVertical,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

interface PixKey {
  id: string;
  type: PixKeyType;
  value: string;
  createdAt: string;
  isPrimary: boolean;
}

const mockPixKeys: PixKey[] = [
  {
    id: 'key_001',
    type: 'EMAIL',
    value: 'financeiro@minhaempresa.com',
    createdAt: '2026-05-10T10:00:00Z',
    isPrimary: true,
  },
  {
    id: 'key_002',
    type: 'CNPJ',
    value: '12.345.678/0001-90',
    createdAt: '2026-05-10T10:00:00Z',
    isPrimary: false,
  },
];

const keyTypeConfig: Record<PixKeyType, { label: string; icon: typeof Key }> = {
  CPF: { label: 'CPF', icon: FileText },
  CNPJ: { label: 'CNPJ', icon: FileText },
  EMAIL: { label: 'Email', icon: Mail },
  PHONE: { label: 'Telefone', icon: Phone },
  RANDOM: { label: 'Aleatória', icon: Hash },
};

export default function PixKeysPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success('Chave copiada!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Chaves PIX</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerencie suas chaves para receber pagamentos
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="size-4" />
          Cadastrar chave
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-[--radius-xl] border border-accent/30 bg-accent/5 p-4">
        <div className="flex gap-3">
          <Shield className="size-5 text-accent-300 shrink-0" />
          <div>
            <p className="text-[13px] text-accent-200 font-medium">Limite de chaves</p>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Você pode cadastrar até 5 chaves PIX. Atualmente você tem {mockPixKeys.length} chave(s) cadastrada(s).
            </p>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-3">
        {mockPixKeys.map((key) => {
          const config = keyTypeConfig[key.type];
          const Icon = config.icon;

          return (
            <div
              key={key.id}
              className="rounded-[--radius-xl] border border-divider bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[--radius-lg] bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <Icon className="size-5 text-accent-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                        {config.label}
                      </span>
                      {key.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-accent/20 text-accent-200 border border-accent/30">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-medium mt-0.5 font-mono">{key.value}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(key.value, key.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[--radius-lg] border border-divider text-[12px] text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  >
                    {copiedId === key.id ? (
                      <Check className="size-3.5 text-green-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copiar
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === key.id ? null : key.id)}
                      className="w-8 h-8 rounded-[--radius-lg] border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                    >
                      <MoreVertical className="size-4" />
                    </button>

                    {menuOpen === key.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-divider rounded-[--radius-lg] shadow-lg z-50 py-1">
                          {!key.isPrimary && (
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                              <Key className="size-3.5" />
                              Tornar principal
                            </button>
                          )}
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:text-red-300 hover:bg-neutral-900">
                            <Trash2 className="size-3.5" />
                            Excluir chave
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-divider">
                <p className="text-[11px] text-neutral-600">
                  Cadastrada em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state if no keys */}
      {mockPixKeys.length === 0 && (
        <div className="rounded-[--radius-xl] border border-dashed border-divider p-8 text-center">
          <Key className="size-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-[14px] text-neutral-400 mb-1">Nenhuma chave cadastrada</p>
          <p className="text-[12px] text-neutral-600 mb-4">
            Cadastre uma chave PIX para começar a receber pagamentos
          </p>
          <Button variant="primary" size="sm" className="gap-2">
            <Plus className="size-4" />
            Cadastrar chave
          </Button>
        </div>
      )}
    </div>
  );
}
