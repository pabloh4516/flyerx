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
  getWithdrawal,
  estimateWithdrawalFee,
  listWithdrawals,
} from '@/lib/api';
import type { TransactionFilters, CreateDepositRequest, CreateWithdrawalRequest, Deposit } from '@/types';
import type { DepositFilters } from '@/lib/api/deposits';
import type { WithdrawalFilters } from '@/lib/api/withdrawals';

// ===== Wallet Queries =====

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    staleTime: 30 * 1000,
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
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
      const data = query.state.data as Deposit | undefined;
      // Refetch enquanto pendente ou processando
      if (data && (data.status === 'PENDING' || data.status === 'PROCESSING')) {
        return 5 * 1000;
      }
      return false;
    },
  });
}

/**
 * Criar depósito via Laravel → Eulen
 */
export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateDepositRequest) => createDeposit(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
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

export function useWithdrawal(id: string, enabled = true) {
  return useQuery({
    queryKey: ['withdrawal', id],
    queryFn: () => getWithdrawal(id),
    enabled: enabled && !!id,
    staleTime: 5 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Refetch enquanto pendente ou processando
      if (data && (data.status === 'PENDING' || data.status === 'PROCESSING')) {
        return 5 * 1000;
      }
      return false;
    },
  });
}

export function useEstimateFee(amount: number, enabled = true) {
  return useQuery({
    queryKey: ['withdrawalFee', amount],
    queryFn: () => estimateWithdrawalFee(amount),
    enabled: enabled && amount > 0,
    staleTime: 60 * 1000,
  });
}

/**
 * Criar saque via Laravel → Eulen
 */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateWithdrawalRequest) => createWithdrawal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

// ===== Invalidation Helper =====

export function useInvalidateWalletData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['deposits'] });
    queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
  };
}
