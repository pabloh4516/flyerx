'use client';

import { useState } from 'react';
import {
  Plus,
  Wallet,
  Copy,
  Check,
  Trash2,
  MoreVertical,
  Shield,
  ExternalLink,
  Star,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Container,
  Badge,
  Input,
  Modal,
  Alert,
} from '@/components/ui';

interface LiquidWallet {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  isPrimary: boolean;
  isVerified: boolean;
}

// Mock data - será substituído por dados reais da API
const mockWallets: LiquidWallet[] = [
  {
    id: 'wallet_001',
    name: 'Carteira Principal',
    address: 'lq1qqwnunstyuf8yyr7scnj06ycp4dzk8drzxrsyan6xq7gymevy7d27ec4gs0pnv909ggvttn36qn270p33ft09wtdttvfe7wu2h',
    createdAt: '2026-08-01T10:00:00Z',
    isPrimary: true,
    isVerified: true,
  },
];

// Validação de endereço Liquid
function isValidLiquidAddress(address: string): boolean {
  if (!address) return false;

  // Prefixos válidos para Liquid (mainnet e testnet)
  const validPrefixes = ['lq1', 'ex1', 'VJL', 'VTp', 'ert1', 'el1'];

  if (!validPrefixes.some(prefix => address.startsWith(prefix))) {
    return false;
  }

  // Tamanho mínimo
  if (address.length < 40) {
    return false;
  }

  return true;
}

function truncateAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 12)}...${address.slice(-12)}`;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<LiquidWallet[]>(mockWallets);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success('Endereço copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const handleAddressChange = (value: string) => {
    setNewWalletAddress(value);
    if (value && !isValidLiquidAddress(value)) {
      setAddressError('Endereço Liquid inválido. Deve começar com lq1, ex1, VJL, VTp, ert1 ou el1.');
    } else {
      setAddressError('');
    }
  };

  const handleAddWallet = () => {
    if (!newWalletName.trim()) {
      toast.error('Informe um nome para a carteira');
      return;
    }

    if (!isValidLiquidAddress(newWalletAddress)) {
      toast.error('Endereço Liquid inválido');
      return;
    }

    // Verificar se já existe
    if (wallets.some(w => w.address === newWalletAddress)) {
      toast.error('Esta carteira já está cadastrada');
      return;
    }

    const newWallet: LiquidWallet = {
      id: `wallet_${Date.now()}`,
      name: newWalletName.trim(),
      address: newWalletAddress.trim(),
      createdAt: new Date().toISOString(),
      isPrimary: wallets.length === 0,
      isVerified: false,
    };

    setWallets([...wallets, newWallet]);
    setShowAddModal(false);
    setNewWalletName('');
    setNewWalletAddress('');
    toast.success('Carteira adicionada com sucesso!');
  };

  const handleSetPrimary = (id: string) => {
    setWallets(wallets.map(w => ({
      ...w,
      isPrimary: w.id === id,
    })));
    setMenuOpen(null);
    toast.success('Carteira principal atualizada');
  };

  const handleDelete = (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    if (wallet?.isPrimary && wallets.length > 1) {
      toast.error('Defina outra carteira como principal antes de excluir esta');
      return;
    }

    setWallets(wallets.filter(w => w.id !== id));
    setMenuOpen(null);
    toast.success('Carteira removida');
  };

  return (
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Carteiras</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerencie suas carteiras Liquid para receber DePix
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="size-4" />
          Adicionar carteira
        </Button>
      </div>

      {/* Info */}
      <Alert variant="info" className="flex gap-3">
        <Shield className="size-5 text-accent-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-accent-200 font-medium">Sobre carteiras Liquid</p>
          <p className="text-xs text-neutral-400 mt-1">
            Suas carteiras Liquid são usadas para receber DePix. A carteira principal será usada como destino padrão para depósitos.
            Você pode usar qualquer carteira compatível com Liquid Network (Blockstream Green, SideSwap, Aqua, etc).
          </p>
        </div>
      </Alert>

      {/* Wallets List */}
      <div className="space-y-3">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="rounded-xl border border-divider bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  wallet.isPrimary
                    ? 'bg-primary/20 border border-primary/40'
                    : 'bg-accent/10 border border-accent/30'
                }`}>
                  <Wallet className={`size-5 ${wallet.isPrimary ? 'text-primary' : 'text-accent-300'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{wallet.name}</span>
                    {wallet.isPrimary && (
                      <Badge variant="success" className="text-[10px]">
                        <Star className="size-2.5 mr-1" />
                        Principal
                      </Badge>
                    )}
                    {wallet.isVerified && (
                      <Badge variant="neutral" className="text-[10px]">
                        Verificada
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-neutral-500 mt-0.5">
                    {truncateAddress(wallet.address)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(wallet.address, wallet.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-divider text-xs text-neutral-400 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                >
                  {copiedId === wallet.id ? (
                    <Check className="size-3.5 text-green-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copiar
                </button>

                <a
                  href={`https://blockstream.info/liquid/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  title="Ver no Explorer"
                >
                  <ExternalLink className="size-4" />
                </a>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === wallet.id ? null : wallet.id)}
                    className="size-8 rounded-lg border border-divider flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
                  >
                    <MoreVertical className="size-4" />
                  </button>

                  {menuOpen === wallet.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-divider rounded-lg shadow-lg z-50 py-1">
                        {!wallet.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(wallet.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                          >
                            <Star className="size-3.5" />
                            Tornar principal
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(wallet.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-900"
                        >
                          <Trash2 className="size-3.5" />
                          Remover carteira
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
              <p className="text-xs text-neutral-600">
                Adicionada em {new Date(wallet.createdAt).toLocaleDateString('pt-BR')}
              </p>
              {wallet.isPrimary && (
                <p className="text-xs text-neutral-500">
                  Usada como destino padrão para depósitos
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {wallets.length === 0 && (
        <div className="rounded-xl border border-dashed border-divider p-8 text-center">
          <Wallet className="size-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-400 mb-1">Nenhuma carteira cadastrada</p>
          <p className="text-xs text-neutral-600 mb-4">
            Adicione uma carteira Liquid para começar a receber DePix
          </p>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="size-4" />
            Adicionar carteira
          </Button>
        </div>
      )}

      {/* Add Wallet Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewWalletName('');
          setNewWalletAddress('');
          setAddressError('');
        }}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Adicionar carteira</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nome da carteira
            </label>
            <Input
              placeholder="Ex: Minha Green Wallet"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Endereço Liquid
            </label>
            <Input
              placeholder="lq1qq..."
              value={newWalletAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={addressError ? 'border-red-500' : ''}
            />
            {addressError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" />
                {addressError}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-1.5">
              Cole o endereço da sua carteira Liquid Network. Compatível com Blockstream Green, SideSwap, Aqua e outras.
            </p>
          </div>

          <Alert variant="warning" className="text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Certifique-se de que o endereço está correto. Envios para endereços errados não podem ser recuperados.
            </span>
          </Alert>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false);
                setNewWalletName('');
                setNewWalletAddress('');
                setAddressError('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleAddWallet}
              disabled={!newWalletName || !newWalletAddress || !!addressError}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
}
