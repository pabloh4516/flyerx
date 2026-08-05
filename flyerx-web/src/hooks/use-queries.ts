'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBalance,
  getWallet,
  listTransactions,
  getTransaction,
  createDeposit,
  getDeposit,
  listDeposits,
  createWithdrawal,
  estimateWithdrawalFee,
  listWithdrawals,
} from '@/lib/api';
import type { TransactionFilters, PixKeyType } from '@/types';
import type { DepositFilters } from '@/lib/api/deposits';
import type { WithdrawalFilters } from '@/lib/api/withdrawals';

// ===== Wallet Queries =====

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    staleTime: 30 * 1000, // 30 segundos
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
  });
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => listTransactions(filters),
    staleTime: 10 * 1000,
  });
}

export function useTransaction(id: string, enabled = true) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
  });
}

// ===== Deposit Queries & Mutations =====

export function useDeposits(filters?: DepositFilters) {
  return useQuery({
    queryKey: ['deposits', filters],
    queryFn: () => listDeposits(filters),
    staleTime: 10 * 1000,
  });
}

export function useDeposit(id: string, enabled = true) {
  return useQuery({
    queryKey: ['deposit', id],
    queryFn: () => getDeposit(id),
    enabled: enabled && !!id,
    staleTime: 5 * 1000,
    refetchInterval: (query) => {
      // Refetch a cada 5 segundos se o depósito estiver pendente
      const data = query.state.data;
      if (data && (data.status === 'PENDING' || data.status === 'PROCESSING')) {
        return 5 * 1000;
      }
      return false;
    },
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => createDeposit(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ===== Withdrawal Queries & Mutations =====

export function useWithdrawals(filters?: WithdrawalFilters) {
  return useQuery({
    queryKey: ['withdrawals', filters],
    queryFn: () => listWithdrawals(filters),
    staleTime: 10 * 1000,
  });
}

export function useEstimateFee(amount: number, enabled = true) {
  return useQuery({
    queryKey: ['withdrawalFee', amount],
    queryFn: () => estimateWithdrawalFee(amount),
    enabled: enabled && amount > 0,
    staleTime: 60 * 1000, // 1 minuto
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      amount,
      pixKeyType,
      pixKey,
      twoFactorCode,
    }: {
      amount: number;
      pixKeyType: PixKeyType;
      pixKey: string;
      twoFactorCode?: string;
    }) => createWithdrawal(amount, pixKeyType, pixKey, twoFactorCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

// ===== Invalidation Helpers =====

export function useInvalidateWalletData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['deposits'] });
    queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    queryClient.invalidateQueries({ queryKey: ['pix2depix'] });
  };
}

// ===== Pix2Depix Queries & Mutations =====

import {
  createPix2DepixDeposit,
  getPix2DepixDepositStatus,
  createPix2DepixWithdraw,
  getPix2DepixWithdrawStatus,
  getPix2DepixUserInfo,
  type CreateDepositParams,
} from '@/lib/api/pix2depix';
import type {
  Pix2DepixDepositStatusResponse,
  Pix2DepixWithdrawStatusResponse,
  Pix2DepixUserInfo,
} from '@/types/pix2depix';

// Criar depósito Pix2Depix
export function useCreatePix2DepixDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateDepositParams) => createPix2DepixDeposit(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix2depix', 'deposits'] });
    },
  });
}

// Consultar status do depósito Pix2Depix (com polling)
export function usePix2DepixDepositStatus(depositId: string, enabled = true) {
  return useQuery({
    queryKey: ['pix2depix', 'deposit-status', depositId],
    queryFn: () => getPix2DepixDepositStatus(depositId),
    enabled: enabled && !!depositId,
    staleTime: 3 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as Pix2DepixDepositStatusResponse | undefined;
      // Continua polling enquanto não estiver em estado final
      if (data && !['depix_sent', 'expired', 'canceled', 'refunded', 'error'].includes(data.status)) {
        return 5 * 1000; // Poll a cada 5 segundos
      }
      return false;
    },
  });
}

// Criar saque Pix2Depix
export function useCreatePix2DepixWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pixKey,
      taxNumber,
      euid,
      amountReais,
      isPayoutAmount = true,
    }: {
      pixKey: string;
      taxNumber: string;
      euid: string;
      amountReais: number;
      isPayoutAmount?: boolean;
    }) => createPix2DepixWithdraw(pixKey, taxNumber, euid, amountReais, isPayoutAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix2depix', 'withdrawals'] });
    },
  });
}

// Consultar status do saque Pix2Depix (com polling)
export function usePix2DepixWithdrawStatus(withdrawalId: string, enabled = true) {
  return useQuery({
    queryKey: ['pix2depix', 'withdraw-status', withdrawalId],
    queryFn: () => getPix2DepixWithdrawStatus(withdrawalId),
    enabled: enabled && !!withdrawalId,
    staleTime: 3 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as Pix2DepixWithdrawStatusResponse | undefined;
      // Continua polling enquanto não estiver em estado final
      if (data && !['sent', 'error', 'canceled', 'refunded'].includes(data.status)) {
        return 5 * 1000; // Poll a cada 5 segundos
      }
      return false;
    },
  });
}

// Consultar informações do usuário Pix2Depix (limites)
export function usePix2DepixUserInfo(euid: string, enabled = true) {
  return useQuery({
    queryKey: ['pix2depix', 'user-info', euid],
    queryFn: () => getPix2DepixUserInfo(euid),
    enabled: enabled && !!euid,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// ===== Flyerx Backend (LWK) Queries =====

import { getDailyLimit, type DailyLimitResponse } from '@/lib/api/flyerx-backend';

// Consultar limite diário por CPF/CNPJ
export function useDailyLimit(taxNumber: string, enabled = true) {
  // Limpar formatação para verificar se é válido
  const cleanTax = taxNumber.replace(/[.\-/]/g, '');
  const isValidLength = cleanTax.length === 11 || cleanTax.length === 14;

  return useQuery({
    queryKey: ['daily-limit', cleanTax],
    queryFn: () => getDailyLimit(taxNumber),
    enabled: enabled && isValidLength,
    staleTime: 30 * 1000, // 30 segundos
    retry: 1,
  });
}
