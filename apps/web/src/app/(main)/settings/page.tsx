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
  Wallet,
  Plus,
  Trash2,
  Star,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, Switch, Container } from '@/components/ui';

import { useAuthStore } from '@/stores/auth';
import { useFeesStore } from '@/stores/fees';
import { isValidLiquidAddress } from '@/lib/api/pix2depix';

type Tab = 'wallet' | 'business' | 'notifications' | 'appearance';

export default function SellerSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const { wallets, addWallet, removeWallet, setDefaultWallet } = useFeesStore();

  const [activeTab, setActiveTab] = useState<Tab>('wallet');
  const [isSaving, setIsSaving] = useState(false);

  // Wallet form state
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [walletError, setWalletError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

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

  const handleAddWallet = () => {
    setWalletError('');

    if (!newWalletName.trim()) {
      setWalletError('Informe um nome para a carteira');
      return;
    }

    if (!newWalletAddress.trim()) {
      setWalletError('Informe o endereço Liquid');
      return;
    }

    if (!isValidLiquidAddress(newWalletAddress.trim())) {
      setWalletError('Endereço Liquid inválido. Deve começar com lq1... ou ex1...');
      return;
    }

    addWallet({
      label: newWalletName.trim(),
      address: newWalletAddress.trim(),
      isDefault: wallets.length === 0,
    });

    setNewWalletName('');
    setNewWalletAddress('');
    toast.success('Carteira adicionada com sucesso!');
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Endereço copiado!');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Building }[] = [
    { id: 'wallet', label: 'Carteira', icon: Wallet },
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

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-4">
          {/* Info */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                <Wallet className="size-4 text-accent-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-200">Carteira Liquid (DePix)</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Configure seu endereço Liquid para receber DePix nos depósitos.
                  O endereço padrão será usado automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Wallet List */}
          <div className="rounded-xl border border-divider bg-surface p-4">
            <h2 className="text-sm font-medium text-neutral-400 mb-4">Suas carteiras</h2>

            {wallets.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Wallet className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma carteira configurada</p>
                <p className="text-xs mt-1">Adicione uma carteira para receber DePix</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`rounded-lg border p-3 flex items-center gap-3 ${
                      wallet.isDefault
                        ? 'border-accent/50 bg-accent/5'
                        : 'border-divider'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{wallet.label}</p>
                        {wallet.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-300 uppercase tracking-wider">
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-mono truncate mt-0.5">
                        {wallet.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyAddress(wallet.address)}
                        className="size-8 rounded-md hover:bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                        title="Copiar endereço"
                      >
                        {copiedAddress === wallet.address ? (
                          <Check className="size-4 text-accent-300" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>

                      {!wallet.isDefault && (
                        <button
                          onClick={() => setDefaultWallet(wallet.id)}
                          className="size-8 rounded-md hover:bg-white/5 flex items-center justify-center text-neutral-400 hover:text-amber-400 transition-colors"
                          title="Definir como padrão"
                        >
                          <Star className="size-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          removeWallet(wallet.id);
                          toast.success('Carteira removida');
                        }}
                        className="size-8 rounded-md hover:bg-white/5 flex items-center justify-center text-neutral-400 hover:text-red-400 transition-colors"
                        title="Remover carteira"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Wallet Form */}
          <div className="rounded-xl border border-divider bg-surface p-4">
            <h2 className="text-sm font-medium text-neutral-400 mb-4">Adicionar nova carteira</h2>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-500">Nome da carteira</label>
                <Input
                  placeholder="Ex: Minha Aqua Wallet"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-500">Endereço Liquid</label>
                <Input
                  placeholder="lq1qq... ou ex1..."
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-neutral-600">
                  Cole o endereço da sua carteira Liquid. Aceita formatos lq1... e ex1...
                </p>
              </div>

              {walletError && (
                <p className="text-xs text-red-400">{walletError}</p>
              )}

              <Button variant="primary" onClick={handleAddWallet}>
                <Plus className="size-4" />
                Adicionar carteira
              </Button>
            </div>
          </div>
        </div>
      )}

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
