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

// Tipo da resposta do Laravel (snake_case)
interface LaravelDepositResponse {
  id: string;
  wallet_id: string;
  status: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  pix: {
    qr_code: string | null;
    copy_paste: string | null;
    tx_id: string | null;
  };
  expires_at: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

// Mapear resposta Laravel para tipo frontend
function mapDepositResponse(data: LaravelDepositResponse): Deposit {
  return {
    id: data.id,
    type: 'DEPOSIT',
    status: data.status.toUpperCase() as TransactionStatus,
    amount: data.amount,
    fee: data.fee_amount,
    netAmount: data.net_amount,
    pixCopyPaste: data.pix?.copy_paste ?? undefined,
    qrCodeUrl: data.pix?.qr_code ?? undefined,
    expiresAt: data.expires_at ?? '',
    createdAt: data.created_at,
  };
}

/**
 * Criar depósito PIX via Laravel → Eulen
 */
export const createDeposit = async (
  params: CreateDepositRequest
): Promise<Deposit> => {
  const response = await api.post<ApiResponse<LaravelDepositResponse>>('/v1/deposits', params);
  return mapDepositResponse(response.data.data);
};

/**
 * Obter detalhes do depósito
 */
export const getDeposit = async (id: string): Promise<Deposit> => {
  const response = await api.get<ApiResponse<LaravelDepositResponse>>(`/v1/deposits/${id}`);
  return mapDepositResponse(response.data.data);
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
