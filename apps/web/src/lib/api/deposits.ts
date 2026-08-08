import api from './client';
import type {
  Deposit,
  CreateDepositRequest,
  ApiResponse,
  PaginatedResponse,
  PaginatedRequest,
  TransactionStatus,
} from '@/types';

export interface DepositFilters extends PaginatedRequest {
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Criar depósito PIX via Laravel → Eulen
 */
export const createDeposit = async (
  params: CreateDepositRequest
): Promise<Deposit> => {
  const response = await api.post<ApiResponse<{ deposit: Deposit }>>('/v1/deposits', params);
  return response.data.data.deposit;
};

/**
 * Obter detalhes do depósito
 */
export const getDeposit = async (id: string): Promise<Deposit> => {
  const response = await api.get<ApiResponse<Deposit>>(`/v1/deposits/${id}`);
  return response.data.data;
};

/**
 * Listar depósitos pendentes
 */
export const getPendingDeposits = async (): Promise<Deposit[]> => {
  const response = await api.get<ApiResponse<Deposit[]>>('/v1/deposits/pending');
  return response.data.data;
};

/**
 * Listar depósitos com filtros
 */
export const listDeposits = async (
  filters?: DepositFilters
): Promise<PaginatedResponse<Deposit>> => {
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

  const response = await api.get<ApiResponse<PaginatedResponse<Deposit>>>(
    `/v1/deposits?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Cancelar depósito pendente
 */
export const cancelDeposit = async (id: string): Promise<Deposit> => {
  const response = await api.post<ApiResponse<Deposit>>(`/v1/deposits/${id}/cancel`);
  return response.data.data;
};
