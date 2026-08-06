'use client';

import { useState } from 'react';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, Switch, Container } from '@/components/ui';

import { useAuthStore } from '@/stores/auth';

type Tab = 'business' | 'notifications' | 'appearance';

export default function SellerSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<Tab>('business');
  const [isSaving, setIsSaving] = useState(false);

  const [businessData, setBusinessData] = useState({
    companyName: 'Minha Empresa LTDA',
    tradeName: 'Minha Empresa',
    document: '12.345.678/0001-90',
    email: 'contato@minhaempresa.com',
    phone: '(11) 99999-8888',
    address: 'Rua Example, 123 - São Paulo, SP',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Building }[] = [
    { id: 'business', label: 'Dados da empresa', icon: Building },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
  ];

  return (
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Configurações</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Gerencie as configurações da sua conta de vendedor
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-divider w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent/20 text-accent-200'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Business Tab */}
      {activeTab === 'business' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-divider bg-surface p-4">
            <h2 className="text-sm font-medium text-neutral-400 mb-4">Informações da empresa</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Building className="size-3" />
                  Razão social
                </label>
                <Input
                  value={businessData.companyName}
                  onChange={(e) => setBusinessData({ ...businessData, companyName: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Building className="size-3" />
                  Nome fantasia
                </label>
                <Input
                  value={businessData.tradeName}
                  onChange={(e) => setBusinessData({ ...businessData, tradeName: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <FileText className="size-3" />
                  CNPJ
                </label>
                <Input
                  value={businessData.document}
                  disabled
                  className="opacity-60"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Mail className="size-3" />
                  Email comercial
                </label>
                <Input
                  type="email"
                  value={businessData.email}
                  onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Phone className="size-3" />
                  Telefone
                </label>
                <Input
                  value={businessData.phone}
                  onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="size-3" />
                  Endereço
                </label>
                <Input
                  value={businessData.address}
                  onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-divider bg-surface p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Shield className="size-4 text-accent-300" />
              </div>
              <div>
                <p className="text-sm font-medium">Segurança</p>
                <p className="text-xs text-neutral-500">Configurações de segurança da conta</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm">Autenticação em duas etapas</p>
                  <p className="text-xs text-neutral-500">Adicione uma camada extra de segurança</p>
                </div>
                <Switch checked={user?.twoFactorEnabled} />
              </div>

              <div className="border-t border-divider" />

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm">Confirmar transações por email</p>
                  <p className="text-xs text-neutral-500">Receba confirmação para saques</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            <Save className="size-4" />
            Salvar alterações
          </Button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="rounded-xl border border-divider bg-surface p-4">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Preferências de notificação</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">Pagamentos recebidos</p>
                <p className="text-xs text-neutral-500">Notificar quando receber um pagamento</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border-t border-divider" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">Saques concluídos</p>
                <p className="text-xs text-neutral-500">Notificar quando um saque for processado</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border-t border-divider" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">Relatório diário</p>
                <p className="text-xs text-neutral-500">Receber resumo diário por email</p>
              </div>
              <Switch />
            </div>

            <div className="border-t border-divider" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">Alertas de segurança</p>
                <p className="text-xs text-neutral-500">Notificar sobre atividades suspeitas</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border-t border-divider" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">Novidades do Flyerx</p>
                <p className="text-xs text-neutral-500">Receber atualizações sobre novos recursos</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="rounded-xl border border-divider bg-surface p-4">
          <h2 className="text-sm font-medium text-neutral-400 mb-4">Personalização</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">Cor da marca</p>
              <p className="text-xs text-neutral-500 mb-3">
                Essa cor será usada nos seus links de pagamento
              </p>
              <div className="flex items-center gap-3">
                {['#9184d9', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
                  <button
                    key={color}
                    className="size-8 rounded-lg border-2 border-transparent hover:border-white/50 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-divider pt-4">
              <p className="text-sm mb-2">Logo da empresa</p>
              <p className="text-xs text-neutral-500 mb-3">
                Exibida nos links de pagamento e recibos
              </p>
              <div className="size-20 rounded-xl border border-dashed border-divider flex items-center justify-center text-neutral-600 cursor-pointer hover:border-neutral-500 transition-colors">
                <span className="text-xs">Upload</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
