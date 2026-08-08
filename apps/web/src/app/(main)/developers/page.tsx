'use client';

import { useState } from 'react';
import {
  Code,
  Key,
  Copy,
  Check,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  ExternalLink,
  Terminal,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, Container } from '@/components/ui';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered: string | null;
}

// TODO: Integrar com API quando os endpoints estiverem disponíveis
const apiKeys: ApiKey[] = [];
const webhooks: WebhookConfig[] = [];

export default function DevelopersPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success('Copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const toggleKeyVisibility = (id: string) => {
    const newSet = new Set(visibleKeys);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisibleKeys(newSet);
  };

  return (
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Desenvolvedores</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Integre o Flyerx com sua aplicação
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="#"
          className="rounded-xl border border-divider bg-surface p-4 hover:border-accent/50 transition-colors group"
        >
          <Terminal className="size-5 text-accent-300 mb-2" />
          <p className="text-sm font-medium group-hover:text-accent-200 transition-colors">
            Documentação API
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Guia completo de integração
          </p>
        </a>
        <a
          href="#"
          className="rounded-xl border border-divider bg-surface p-4 hover:border-accent/50 transition-colors group"
        >
          <Code className="size-5 text-accent-300 mb-2" />
          <p className="text-sm font-medium group-hover:text-accent-200 transition-colors">
            SDKs
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Node.js, Python, PHP
          </p>
        </a>
        <a
          href="#"
          className="rounded-xl border border-divider bg-surface p-4 hover:border-accent/50 transition-colors group"
        >
          <ExternalLink className="size-5 text-accent-300 mb-2" />
          <p className="text-sm font-medium group-hover:text-accent-200 transition-colors">
            Sandbox
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ambiente de testes
          </p>
        </a>
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-divider bg-surface">
        <div className="flex items-center justify-between p-4 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Key className="size-4 text-accent-300" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Chaves de API</h2>
              <p className="text-xs text-neutral-500">Gerencie suas chaves de acesso</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-3.5" />
            Nova chave
          </Button>
        </div>

        <div className="divide-y divide-divider">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{apiKey.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs text-neutral-400 font-mono bg-neutral-900 px-2 py-0.5 rounded">
                      {visibleKeys.has(apiKey.id)
                        ? apiKey.key.replace('...', 'ghi789jkl012mno345')
                        : apiKey.key}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  >
                    {visibleKeys.has(apiKey.id) ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  >
                    {copiedId === apiKey.id ? (
                      <Check className="size-4 text-green-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <button className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors">
                    <RefreshCw className="size-4" />
                  </button>
                  <button className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-red-400 hover:border-red-500/50 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-neutral-600">
                <span>Criada em {new Date(apiKey.createdAt).toLocaleDateString('pt-BR')}</span>
                {apiKey.lastUsed && (
                  <span>Último uso: {new Date(apiKey.lastUsed).toLocaleString('pt-BR')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="rounded-xl border border-divider bg-surface">
        <div className="flex items-center justify-between p-4 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Webhook className="size-4 text-accent-300" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Webhooks</h2>
              <p className="text-xs text-neutral-500">Receba notificações em tempo real</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-3.5" />
            Novo webhook
          </Button>
        </div>

        <div className="divide-y divide-divider">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-neutral-300 font-mono">
                      {webhook.url}
                    </code>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      webhook.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}>
                      {webhook.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-400 border border-divider"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-red-400 hover:border-red-500/50 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {webhook.lastTriggered && (
                <p className="text-xs text-neutral-600 mt-3">
                  Último disparo: {new Date(webhook.lastTriggered).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
