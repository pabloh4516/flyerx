import { create } from 'zustand';
import type { Wallet, Balance, Transaction } from '@/types';
import { getWallet, getBalance, listTransactions } from '@/lib/api/wallet';

interface WalletState {
  wallet: Wallet | null;
  balance: Balance | null;
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  fetchRecentTransactions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  wallet: null,
  balance: null,
  recentTransactions: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>()((set, get) => ({
  ...initialState,

  fetchWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      const wallet = await getWallet();
      set({ wallet, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Falha ao carregar carteira',
      });
    }
  },

  fetchBalance: async () => {
    try {
      set({ isLoading: true, error: null });
      const balance = await getBalance();
      set({ balance, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Falha ao carregar saldo',
      });
    }
  },

  fetchRecentTransactions: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await listTransactions({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      set({ recentTransactions: response.data, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Falha ao carregar transações',
      });
    }
  },

  refreshAll: async () => {
    const { fetchWallet, fetchBalance, fetchRecentTransactions } = get();
    set({ isLoading: true, error: null });
    try {
      await Promise.all([fetchWallet(), fetchBalance(), fetchRecentTransactions()]);
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));

// Seletores
export const useAvailableBalance = () => {
  return useWalletStore((state) => state.balance?.available ?? 0);
};

export const useTotalBalance = () => {
  return useWalletStore((state) => state.balance?.total ?? 0);
};
