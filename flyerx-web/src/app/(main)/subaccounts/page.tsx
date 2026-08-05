'use client';

import { useState } from 'react';
import {
  Plus,
  Users,
  Search,
  MoreVertical,
  User,
  Mail,
  Shield,
  Trash2,
  Edit,
  Key,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

type SubaccountRole = 'admin' | 'operator' | 'viewer';
type SubaccountStatus = 'active' | 'pending' | 'blocked';

interface Subaccount {
  id: string;
  name: string;
  email: string;
  role: SubaccountRole;
  status: SubaccountStatus;
  lastAccess: string | null;
  createdAt: string;
}

const mockSubaccounts: Subaccount[] = [
  {
    id: 'sub_001',
    name: 'Maria Silva',
    email: 'maria@empresa.com',
    role: 'admin',
    status: 'active',
    lastAccess: '2026-08-05T10:30:00Z',
    createdAt: '2026-06-01T09:00:00Z',
  },
  {
    id: 'sub_002',
    name: 'João Santos',
    email: 'joao@empresa.com',
    role: 'operator',
    status: 'active',
    lastAccess: '2026-08-04T16:45:00Z',
    createdAt: '2026-07-15T14:00:00Z',
  },
  {
    id: 'sub_003',
    name: 'Ana Costa',
    email: 'ana@empresa.com',
    role: 'viewer',
    status: 'pending',
    lastAccess: null,
    createdAt: '2026-08-03T11:00:00Z',
  },
];

const roleConfig: Record<SubaccountRole, { label: string; className: string }> = {
  admin: { label: 'Administrador', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  operator: { label: 'Operador', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  viewer: { label: 'Visualizador', className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' },
};

const statusConfig: Record<SubaccountStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  blocked: { label: 'Bloqueado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function SubaccountsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredSubaccounts = mockSubaccounts.filter((sub) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        sub.name.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Subcontas</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerencie usuários com acesso à sua conta
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-2">
          <Plus className="size-4" />
          Convidar usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[--radius-xl] border border-divider bg-surface p-4">
          <p className="text-[11px] text-neutral-500 mb-1">Total de usuários</p>
          <p className="text-2xl font-semibold">{mockSubaccounts.length}</p>
        </div>
        <div className="rounded-[--radius-xl] border border-divider bg-surface p-4">
          <p className="text-[11px] text-neutral-500 mb-1">Ativos</p>
          <p className="text-2xl font-semibold text-green-400">
            {mockSubaccounts.filter((s) => s.status === 'active').length}
          </p>
        </div>
        <div className="rounded-[--radius-xl] border border-divider bg-surface p-4">
          <p className="text-[11px] text-neutral-500 mb-1">Pendentes</p>
          <p className="text-2xl font-semibold text-yellow-400">
            {mockSubaccounts.filter((s) => s.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border border-divider rounded-[--radius-lg] px-3 py-2 max-w-[320px]">
        <Search className="size-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm placeholder:text-neutral-600 focus:outline-none"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredSubaccounts.map((sub) => (
          <div
            key={sub.id}
            className="rounded-[--radius-xl] border border-divider bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-800 to-accent-900 border border-accent-700 flex items-center justify-center">
                  <span className="text-[14px] font-medium text-accent-200">
                    {sub.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium">{sub.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] border ${roleConfig[sub.role].className}`}>
                      {roleConfig[sub.role].label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] border ${statusConfig[sub.status].className}`}>
                      {statusConfig[sub.status].label}
                    </span>
                  </div>
                  <p className="text-[12px] text-neutral-500 mt-0.5">{sub.email}</p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === sub.id ? null : sub.id)}
                  className="w-8 h-8 rounded-[--radius-lg] border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                >
                  <MoreVertical className="size-4" />
                </button>

                {menuOpen === sub.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-divider rounded-[--radius-lg] shadow-lg z-50 py-1">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                        <Edit className="size-3.5" />
                        Editar permissões
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900">
                        <Key className="size-3.5" />
                        Resetar senha
                      </button>
                      <div className="border-t border-divider my-1" />
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:text-red-300 hover:bg-neutral-900">
                        <Trash2 className="size-3.5" />
                        Remover acesso
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-divider flex items-center gap-6 text-[11px] text-neutral-600">
              <span>
                Adicionado em {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
              </span>
              {sub.lastAccess && (
                <span>
                  Último acesso: {formatDate(sub.lastAccess)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSubaccounts.length === 0 && (
        <div className="rounded-[--radius-xl] border border-dashed border-divider p-8 text-center">
          <Users className="size-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-[14px] text-neutral-400 mb-1">Nenhum usuário encontrado</p>
          <p className="text-[12px] text-neutral-600">
            {searchQuery ? 'Tente uma busca diferente' : 'Convide usuários para colaborar'}
          </p>
        </div>
      )}
    </div>
  );
}
