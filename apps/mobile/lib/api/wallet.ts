import api, { generateIdempotencyKey } from './client';
import type {
  Balance,
  Transaction,
  Deposit,
  Withdrawal,
  EstimateFeeResponse,
  ApiResponse,
  PaginatedResponse,
  PixKeyType,
} from '../../types';

// ===== Wallet =====

export const getBalance = async (): Promise<Balance> => {
  const response = await api.get<ApiResponse<Balance>>('/v1/wallet/balance');
  return response.data.data;
};

export const listTransactions = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Transaction>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Transaction>>>(
    '/v1/wallet/transactions',
    { params }
  );
  return response.data.data;
};

// ===== Deposits =====

export const createDeposit = async (amount: number): Promise<Deposit> => {
  const response = await api.post<ApiResponse<{ deposit: Deposit }>>('/v1/deposits', {
    amount,
    idempotencyKey: generateIdempotencyKey(),
  });
  return response.data.data.deposit;
};

export const getDeposit = async (id: string): Promise<Deposit> => {
  const response = await api.get<ApiResponse<Deposit>>(`/v1/deposits/${id}`);
  return response.data.data;
};

// ===== Withdrawals =====

export const estimateWithdrawalFee = async (amount: number): Promise<EstimateFeeResponse> => {
  const response = await api.post<ApiResponse<EstimateFeeResponse>>(
    '/v1/withdrawals/estimate-fee',
    { amount }
  );
  return response.data.data;
};

export const createWithdrawal = async (
  amount: number,
  pixKeyType: PixKeyType,
  pixKey: string,
  twoFactorCode?: string
): Promise<Withdrawal> => {
  const response = await api.post<ApiResponse<Withdrawal>>('/v1/withdrawals', {
    amount,
    pixKeyType,
    pixKey,
    twoFactorCode,
    idempotencyKey: generateIdempotencyKey(),
  });
  return response.data.data;
};
