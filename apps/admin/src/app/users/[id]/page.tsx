'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Shield,
  Wallet,
  Calendar,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getUser, updateUserStatus, updateUserKYC, listTransactions } from '@/lib/api/admin';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  ACTIVE: { label: 'Ativo', variant: 'default' },
  BLOCKED: { label: 'Bloqueado', variant: 'destructive' },
  PENDING: { label: 'Pendente', variant: 'secondary' },
};

const kycConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Não verificado', color: 'bg-gray-100 text-gray-700' },
  BASIC: { label: 'Básico', color: 'bg-yellow-100 text-yellow-700' },
  VERIFIED: { label: 'Verificado', color: 'bg-blue-100 text-blue-700' },
  FULL: { label: 'Completo', color: 'bg-green-100 text-green-700' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const { isAuthenticated, isLoading: authLoading, fetchAdmin } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState<string>('');

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
    enabled: isAuthenticated && !!userId,
  });

  const { data: transactions } = useQuery({
    queryKey: ['user-transactions', userId],
    queryFn: () => listTransactions({ page: 1, limit: 5 }),
    enabled: isAuthenticated && !!userId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'BLOCKED') => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      setShowBlockDialog(false);
      toast.success('Status do usuário atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const kycMutation = useMutation({
    mutationFn: (kycLevel: string) => updateUserKYC(userId, kycLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      setShowKYCDialog(false);
      toast.success('Nível KYC atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar KYC');
    },
  });

  const handleToggleBlock = () => {
    if (user) {
      const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      statusMutation.mutate(newStatus);
    }
  };

  const handleKYCUpdate = () => {
    if (selectedKYC) {
      kycMutation.mutate(selectedKYC);
    }
  };

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
          <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link href="/users">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
                <p className="text-muted-foreground">
                  {userLoading ? <Skeleton className="h-4 w-32" /> : user?.email}
                </p>
              </div>
            </div>

            {userLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : user ? (
              <>
                {/* User Info Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Personal Info */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Informações Pessoais</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome:</span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Mail className="h-4 w-4" /> Email:
                        </span>
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-4 w-4" /> Telefone:
                          </span>
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileText className="h-4 w-4" /> Documento:
                        </span>
                        <span className="font-mono">{user.document}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{user.documentType}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status & Security */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Status e Segurança</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={statusConfig[user.status].variant}>
                          {statusConfig[user.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Nível KYC:</span>
                        <span className={`px-2 py-1 rounded text-xs ${kycConfig[user.kycLevel].color}`}>
                          {kycConfig[user.kycLevel].label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">2FA:</span>
                        <span>{user.twoFactorEnabled ? 'Ativado' : 'Desativado'}</span>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button
                          variant={user.status === 'BLOCKED' ? 'default' : 'destructive'}
                          size="sm"
                          onClick={() => setShowBlockDialog(true)}
                        >
                          {user.status === 'BLOCKED' ? (
                            <>
                              <Unlock className="h-4 w-4 mr-1" /> Desbloquear
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-1" /> Bloquear
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedKYC(user.kycLevel);
                            setShowKYCDialog(true);
                          }}
                        >
                          Alterar KYC
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wallet */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Carteira</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
                        <p className="text-3xl font-bold">{formatCurrency(user.walletBalance)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Info */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Informações da Conta</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criado em:</span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Atualizado em:</span>
                        <span>{formatDate(user.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono text-sm">{user.id}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transações Recentes</CardTitle>
                    <CardDescription>Últimas 5 transações do usuário</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions?.data && transactions.data.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.data.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {tx.type === 'DEPOSIT' ? 'Depósito' : 'Saque'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(tx.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-medium ${
                                  tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-orange-600'
                                }`}
                              >
                                {tx.type === 'DEPOSIT' ? '+' : '-'}
                                {formatCurrency(tx.amount)}
                              </p>
                              <Badge
                                variant={
                                  tx.status === 'COMPLETED'
                                    ? 'default'
                                    : tx.status === 'PENDING'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma transação encontrada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Usuário não encontrado</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Block/Unblock Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user?.status === 'BLOCKED' ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
            </DialogTitle>
            <DialogDescription>
              {user?.status === 'BLOCKED'
                ? 'O usuário poderá acessar a plataforma normalmente após o desbloqueio.'
                : 'O usuário não poderá acessar a plataforma enquanto estiver bloqueado.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>Usuário:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={user?.status === 'BLOCKED' ? 'default' : 'destructive'}
              onClick={handleToggleBlock}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user?.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Dialog */}
      <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Nível KYC</DialogTitle>
            <DialogDescription>
              Selecione o novo nível de verificação do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nível atual:</p>
              <span className={`px-2 py-1 rounded text-xs ${kycConfig[user?.kycLevel || 'NONE'].color}`}>
                {kycConfig[user?.kycLevel || 'NONE'].label}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Novo nível:</p>
              <Select value={selectedKYC} onValueChange={(value) => value && setSelectedKYC(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Não verificado</SelectItem>
                  <SelectItem value="BASIC">Básico</SelectItem>
                  <SelectItem value="VERIFIED">Verificado</SelectItem>
                  <SelectItem value="FULL">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKYCDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleKYCUpdate}
              disabled={kycMutation.isPending || !selectedKYC || selectedKYC === user?.kycLevel}
            >
              {kycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
