import api from './client';
import type {
  Withdrawal,
  CreateWithdrawalRequest,
  EstimateFeeResponse,
  ApiResponse,
  PaginatedResponse,
  PaginatedRequest,
  TransactionStatus,
} from '@/types';

export interface WithdrawalFilters extends PaginatedRequest {
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Estimar taxa de saque
 */
export const estimateWithdrawalFee = async (amount: number): Promise<EstimateFeeResponse> => {
  const response = await api.post<ApiResponse<EstimateFeeResponse>>(
    '/v1/withdrawals/estimate-fee',
    { amount }
  );
  return response.data.data;
};

/**
 * Criar saque PIX via Laravel → Eulen
 */
export const createWithdrawal = async (
  params: CreateWithdrawalRequest
): Promise<Withdrawal> => {
  const response = await api.post<ApiResponse<{ withdrawal: Withdrawal }>>('/v1/withdrawals', params);
  return response.data.data.withdrawal;
};

/**
 * Obter detalhes do saque
 */
export const getWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await api.get<ApiResponse<Withdrawal>>(`/v1/withdrawals/${id}`);
  return response.data.data;
};

/**
 * Listar saques pendentes
 */
export const getPendingWithdrawals = async (): Promise<Withdrawal[]> => {
  const response = await api.get<ApiResponse<Withdrawal[]>>('/v1/withdrawals/pending');
  return response.data.data;
};

/**
 * Listar saques com filtros
 */
export const listWithdrawals = async (
  filters?: WithdrawalFilters
): Promise<PaginatedResponse<Withdrawal>> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  }

  const response = await api.get<ApiResponse<PaginatedResponse<Withdrawal>>>(
    `/v1/withdrawals?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Cancelar saque pendente
 */
export const cancelWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await api.post<ApiResponse<Withdrawal>>(`/v1/withdrawals/${id}/cancel`);
  return response.data.data;
};
