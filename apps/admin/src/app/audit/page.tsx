'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Calendar,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { useAdminStore } from '@/stores/auth';
import { listAuditLogs } from '@/lib/api/admin';
import type { AuditLog } from '@/types';

const actionConfig: Record<string, { label: string; color: string }> = {
  LOGIN: { label: 'Login', color: 'bg-blue-100 text-blue-700' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-100 text-gray-700' },
  USER_BLOCK: { label: 'Bloqueio de usuário', color: 'bg-red-100 text-red-700' },
  USER_UNBLOCK: { label: 'Desbloqueio de usuário', color: 'bg-green-100 text-green-700' },
  KYC_APPROVE: { label: 'Aprovação KYC', color: 'bg-green-100 text-green-700' },
  KYC_REJECT: { label: 'Rejeição KYC', color: 'bg-red-100 text-red-700' },
  WITHDRAWAL_APPROVE: { label: 'Aprovação de saque', color: 'bg-green-100 text-green-700' },
  WITHDRAWAL_REJECT: { label: 'Rejeição de saque', color: 'bg-red-100 text-red-700' },
  FEE_UPDATE: { label: 'Atualização de taxa', color: 'bg-yellow-100 text-yellow-700' },
  SETTINGS_UPDATE: { label: 'Atualização de config', color: 'bg-purple-100 text-purple-700' },
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

interface AuditLogRowProps {
  log: AuditLog;
}

function AuditLogRow({ log }: AuditLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const actionInfo = actionConfig[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{log.adminName}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded text-xs ${actionInfo.color}`}>
            {actionInfo.label}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-mono text-sm">{log.resource}</span>
          {log.resourceId && (
            <span className="text-muted-foreground text-sm ml-1">
              ({log.resourceId.slice(0, 8)}...)
            </span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Globe className="h-3 w-3" />
            {log.ip}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {formatDate(log.createdAt)}
          </div>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/50">
            <div className="p-4">
              <h4 className="text-sm font-medium mb-2">Detalhes da ação</h4>
              <pre className="text-xs bg-background p-3 rounded-md overflow-auto max-h-48">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function AuditPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, fetchAdmin } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, search, action: actionFilter }],
    queryFn: () =>
      listAuditLogs({
        page,
        limit: 20,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      }),
    enabled: isAuthenticated,
  });

  const logs = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex-1 flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
              <p className="text-muted-foreground">
                Histórico de ações realizadas pelos administradores
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por administrador ou recurso..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={(value) => value && setActionFilter(value)}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="USER_BLOCK">Bloqueio de usuário</SelectItem>
                  <SelectItem value="USER_UNBLOCK">Desbloqueio de usuário</SelectItem>
                  <SelectItem value="KYC_APPROVE">Aprovação KYC</SelectItem>
                  <SelectItem value="KYC_REJECT">Rejeição KYC</SelectItem>
                  <SelectItem value="WITHDRAWAL_APPROVE">Aprovação de saque</SelectItem>
                  <SelectItem value="WITHDRAWAL_REJECT">Rejeição de saque</SelectItem>
                  <SelectItem value="FEE_UPDATE">Atualização de taxa</SelectItem>
                  <SelectItem value="SETTINGS_UPDATE">Atualização de config</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                      </TableRow>
                    ))
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <p className="text-muted-foreground">Nenhum log encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => <AuditLogRow key={log.id} log={log} />)
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
