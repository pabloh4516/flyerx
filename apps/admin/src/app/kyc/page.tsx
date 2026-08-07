'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Eye,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { useAdminStore } from '@/stores/auth';
import { listKYCRequests, approveKYC, rejectKYC } from '@/lib/api/admin';
import type { KYCRequest } from '@/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  PENDING: { label: 'Pendente', variant: 'secondary' },
  APPROVED: { label: 'Aprovado', variant: 'default' },
  REJECTED: { label: 'Rejeitado', variant: 'destructive' },
};

const kycLevelConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Não verificado', color: 'bg-gray-100 text-gray-700' },
  BASIC: { label: 'Básico', color: 'bg-yellow-100 text-yellow-700' },
  VERIFIED: { label: 'Verificado', color: 'bg-blue-100 text-blue-700' },
  FULL: { label: 'Completo', color: 'bg-green-100 text-green-700' },
};

const documentTypeLabels: Record<string, string> = {
  RG_FRONT: 'RG (Frente)',
  RG_BACK: 'RG (Verso)',
  CNH_FRONT: 'CNH (Frente)',
  CNH_BACK: 'CNH (Verso)',
  SELFIE: 'Selfie com documento',
  PROOF_OF_ADDRESS: 'Comprovante de endereço',
  CNPJ_CARD: 'Cartão CNPJ',
  SOCIAL_CONTRACT: 'Contrato Social',
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function KYCPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, fetchAdmin } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(1);

  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-requests', { page, search, status: statusFilter }],
    queryFn: () =>
      listKYCRequests({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    enabled: isAuthenticated,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveKYC(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-requests'] });
      setShowDetailsDialog(false);
      setSelectedRequest(null);
      toast.success('KYC aprovado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao aprovar KYC');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectKYC(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-requests'] });
      setShowRejectDialog(false);
      setShowDetailsDialog(false);
      setRejectReason('');
      setSelectedRequest(null);
      toast.success('KYC rejeitado!');
    },
    onError: () => {
      toast.error('Erro ao rejeitar KYC');
    },
  });

  const handleViewDetails = (request: KYCRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate(selectedRequest.id);
    }
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    rejectMutation.mutate({ id: selectedRequest.id, reason: rejectReason });
  };

  const requests = data?.data ?? [];
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
              <h1 className="text-2xl font-bold">Verificação KYC</h1>
              <p className="text-muted-foreground">Analise e aprove solicitações de verificação</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Nível Atual</TableHead>
                    <TableHead>Nível Solicitado</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => {
                      const status = statusConfig[request.status];
                      const currentLevel = kycLevelConfig[request.currentLevel];
                      const requestedLevel = kycLevelConfig[request.requestedLevel];

                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.userName}</p>
                              <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${currentLevel?.color}`}>
                              {currentLevel?.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${requestedLevel?.color}`}>
                              {requestedLevel?.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{request.documents.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(request.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação KYC</DialogTitle>
            <DialogDescription>
              Analise os documentos e aprove ou rejeite a solicitação.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuário:</span>
                  <span className="font-medium">{selectedRequest.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedRequest.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nível Atual:</span>
                  <span className={`px-2 py-1 rounded text-xs ${kycLevelConfig[selectedRequest.currentLevel]?.color}`}>
                    {kycLevelConfig[selectedRequest.currentLevel]?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nível Solicitado:</span>
                  <span className={`px-2 py-1 rounded text-xs ${kycLevelConfig[selectedRequest.requestedLevel]?.color}`}>
                    {kycLevelConfig[selectedRequest.requestedLevel]?.label}
                  </span>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h4 className="font-medium">Documentos Enviados</h4>
                <div className="grid gap-3">
                  {selectedRequest.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{documentTypeLabels[doc.type] || doc.type}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {statusConfig[doc.status]?.label || doc.status}
                          </p>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {selectedRequest?.status === 'PENDING' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Fechar
              </Button>
              <Button variant="destructive" onClick={handleRejectClick}>
                <X className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Aprovar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar KYC</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O usuário será notificado e poderá enviar novos documentos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Rejeição</Label>
              <Input
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Documento ilegível, foto desfocada..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
