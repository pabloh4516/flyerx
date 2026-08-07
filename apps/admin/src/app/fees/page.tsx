'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, Save, X, Loader2, DollarSign, Percent } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { useAdminStore } from '@/stores/auth';
import { listFees, updateFee } from '@/lib/api/admin';
import type { FeeConfig } from '@/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

interface FeeCardProps {
  fee: FeeConfig;
  onUpdate: (id: string, data: Partial<FeeConfig>) => void;
  isUpdating: boolean;
}

function FeeCard({ fee, onUpdate, isUpdating }: FeeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    minAmount: fee.minAmount,
    maxAmount: fee.maxAmount,
    fixedFee: fee.fixedFee,
    percentageFee: fee.percentageFee * 100,
    isActive: fee.isActive,
  });

  const handleSave = () => {
    onUpdate(fee.id, {
      minAmount: editData.minAmount,
      maxAmount: editData.maxAmount,
      fixedFee: editData.fixedFee,
      percentageFee: editData.percentageFee / 100,
      isActive: editData.isActive,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      minAmount: fee.minAmount,
      maxAmount: fee.maxAmount,
      fixedFee: fee.fixedFee,
      percentageFee: fee.percentageFee * 100,
      isActive: fee.isActive,
    });
    setIsEditing(false);
  };

  const typeLabel = fee.type === 'DEPOSIT' ? 'Depósito' : 'Saque';
  const typeIcon = fee.type === 'DEPOSIT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{typeLabel}</CardTitle>
            <Badge variant={fee.isActive ? 'default' : 'secondary'}>
              {fee.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <CardDescription>
            Configuração de taxa para {typeLabel.toLowerCase()}s
          </CardDescription>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  value={editData.minAmount}
                  onChange={(e) => setEditData({ ...editData, minAmount: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  value={editData.maxAmount}
                  onChange={(e) => setEditData({ ...editData, maxAmount: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Taxa Fixa (R$)</Label>
                <Input
                  type="number"
                  value={editData.fixedFee}
                  onChange={(e) => setEditData({ ...editData, fixedFee: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa Percentual (%)</Label>
                <Input
                  type="number"
                  value={editData.percentageFee}
                  onChange={(e) => setEditData({ ...editData, percentageFee: Number(e.target.value) })}
                  min={0}
                  max={100}
                  step={0.01}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editData.isActive}
                onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
              />
              <Label>Taxa ativa</Label>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Faixa de Valores</p>
                <p className="font-medium">
                  {formatCurrency(fee.minAmount)} - {formatCurrency(fee.maxAmount)}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                <p className="font-medium">
                  {new Date(fee.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Fixa</p>
                  <p className="text-xl font-bold">{formatCurrency(fee.fixedFee)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Percent className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Percentual</p>
                  <p className="text-xl font-bold">{formatPercent(fee.percentageFee)}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Exemplo de cálculo</p>
              <p className="text-sm">
                Para uma transação de <strong>R$ 1.000,00</strong>:
              </p>
              <p className="text-sm mt-1">
                Taxa = {formatCurrency(fee.fixedFee)} + ({formatPercent(fee.percentageFee)} × R$ 1.000,00) ={' '}
                <strong>{formatCurrency(fee.fixedFee + 1000 * fee.percentageFee)}</strong>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, fetchAdmin } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: fees, isLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: listFees,
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeConfig> }) => updateFee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Taxa atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar taxa');
    },
  });

  const handleUpdate = (id: string, data: Partial<FeeConfig>) => {
    updateMutation.mutate({ id, data });
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
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Configuração de Taxas</h1>
              <p className="text-muted-foreground">
                Configure as taxas de depósito e saque da plataforma
              </p>
            </div>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {fees?.map((fee) => (
                  <FeeCard
                    key={fee.id}
                    fee={fee}
                    onUpdate={handleUpdate}
                    isUpdating={updateMutation.isPending}
                  />
                ))}
              </div>
            )}

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funcionam as taxas</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>
                    A <strong>taxa fixa</strong> é cobrada independente do valor da transação.
                  </li>
                  <li>
                    A <strong>taxa percentual</strong> é calculada sobre o valor da transação.
                  </li>
                  <li>
                    A taxa total é a soma da taxa fixa com a taxa percentual.
                  </li>
                  <li>
                    A <strong>faixa de valores</strong> define o mínimo e máximo permitido para cada tipo de transação.
                  </li>
                  <li>
                    Taxas <strong>inativas</strong> não serão cobradas dos usuários.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
