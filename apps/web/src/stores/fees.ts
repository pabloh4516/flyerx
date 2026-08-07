import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FeeConfig,
  TransactionLimits,
  SavedWallet,
  DEFAULT_FEE_CONFIG,
  DEFAULT_LIMITS,
} from '@/types/fees';

interface FeesState {
  // Configuração de taxas
  feeConfig: FeeConfig;
  limits: TransactionLimits;

  // Carteiras salvas do usuário
  wallets: SavedWallet[];

  // Actions
  setFeeConfig: (config: FeeConfig) => void;
  setLimits: (limits: TransactionLimits) => void;

  // Carteiras
  addWallet: (wallet: Omit<SavedWallet, 'id' | 'createdAt'>) => void;
  removeWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;
  getDefaultWallet: () => SavedWallet | undefined;
}

// Valores padrão inline para evitar problemas de importação circular
const defaultFeeConfig: FeeConfig = {
  deposit: {
    eulenFixedFee: 0.99,
    partnerPercentFee: 0.02, // 2% - Funciona via split automático da API Eulen
    partnerFixedFee: 0,
    partnerDepixAddress: 'lq1qqwhzwwnaqmw83gnck8wa3t474tw20e4szuvu3j74qzvpal65e4j2yv3eeveu3x3ueasv7a55sxzc4j8wnw2nc8p9nm62dcl5f',
  },
  withdraw: {
    eulenPercentFee: 0.01,
    eulenMinFee: 1.0,
    // NOTA: Taxas de parceiro em saques NÃO funcionam via API Eulen.
    // A API não suporta split em withdrawals. Para cobrar taxa do parceiro,
    // seria necessário um backend intermediário que:
    // 1. Recebe DePix do usuário no endereço do parceiro
    // 2. Separa a taxa do parceiro
    // 3. Envia o restante para a API Eulen processar o saque
    // Por enquanto, zeramos as taxas de parceiro em saques.
    partnerPercentFee: 0, // Desabilitado - requer backend
    partnerFixedFee: 0,
    partnerMinFee: 0,
    partnerDepixAddress: '', // Não usado sem backend
  },
  updatedAt: new Date().toISOString(),
};

const defaultLimits: TransactionLimits = {
  deposit: {
    min: 2, // Mínimo R$ 2,00
    max: 6000, // Máximo R$ 6.000,00 por QR (limite Eulen)
    firstDepositMax: 500, // Primeiro depósito: R$ 500,00 (CPF não identificado)
    dailyMax: 6000, // Limite diário R$ 6.000,00 por CPF/CNPJ (reset à meia-noite)
  },
  withdraw: {
    min: 10, // Mínimo R$ 10,00 (Eulen permite R$ 2, mas definimos R$ 10 para o Flyerx)
    max: 6000, // Máximo R$ 6.000,00 por saque
    dailyMax: 100000, // Sem limite prático - o limite é do beneficiário (CPF/CNPJ informado), não do usuário
  },
};

export const useFeesStore = create<FeesState>()(
  persist(
    (set, get) => ({
      feeConfig: defaultFeeConfig,
      limits: defaultLimits,
      wallets: [],

      setFeeConfig: (config) => set({ feeConfig: config }),

      setLimits: (limits) => set({ limits }),

      addWallet: (wallet) => {
        const newWallet: SavedWallet = {
          ...wallet,
          id: `wallet-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          // Se é a primeira carteira ou marcada como default, definir como padrão
          const wallets = state.wallets.map((w) => ({
            ...w,
            isDefault: wallet.isDefault ? false : w.isDefault,
          }));

          if (wallet.isDefault || wallets.length === 0) {
            newWallet.isDefault = true;
          }

          return { wallets: [...wallets, newWallet] };
        });
      },

      removeWallet: (id) => {
        set((state) => {
          const wallets = state.wallets.filter((w) => w.id !== id);
          // Se removeu a carteira padrão, definir a primeira como padrão
          if (wallets.length > 0 && !wallets.some((w) => w.isDefault)) {
            wallets[0].isDefault = true;
          }
          return { wallets };
        });
      },

      setDefaultWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.map((w) => ({
            ...w,
            isDefault: w.id === id,
          })),
        }));
      },

      getDefaultWallet: () => {
        const { wallets } = get();
        return wallets.find((w) => w.isDefault) || wallets[0];
      },
    }),
    {
      name: 'flyerx-fees-storage',
      partialize: (state) => ({
        wallets: state.wallets,
        // feeConfig vem do backend, não persistir localmente
      }),
    }
  )
);
