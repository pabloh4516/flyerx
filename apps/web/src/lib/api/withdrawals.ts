import api from './client';
import type {
  Withdrawal,
  CreateWithdrawalRequest,
  EstimateFeeResponse,
  ApiResponse,
  PaginatedResponse,
  PaginatedRequest,
  TransactionStatus,
  PixKeyType,
} from '@/types';

export interface WithdrawalFilters extends PaginatedRequest {
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

// Tipo da resposta do Laravel (snake_case)
interface LaravelWithdrawalResponse {
  id: string;
  wallet_id: string;
  status: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  pix: {
    key_type: string;
    key: string;
    recipient_name: string | null;
  };
  end_to_end_id: string | null;
  processed_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

// Mapear resposta Laravel para tipo frontend
function mapWithdrawalResponse(data: LaravelWithdrawalResponse): Withdrawal {
  return {
    id: data.id,
    type: 'WITHDRAWAL',
    status: data.status.toUpperCase() as TransactionStatus,
    amount: data.amount,
    fee: data.fee_amount,
    netAmount: data.net_amount,
    pixKeyType: data.pix?.key_type as PixKeyType,
    pixKey: data.pix?.key ?? '',
    recipientName: data.pix?.recipient_name ?? undefined,
    endToEndId: data.end_to_end_id ?? undefined,
    createdAt: data.created_at,
  };
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
  const response = await api.post<ApiResponse<LaravelWithdrawalResponse>>('/v1/withdrawals', params);
  return mapWithdrawalResponse(response.data.data);
};

/**
 * Obter detalhes do saque
 */
export const getWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await api.get<ApiResponse<LaravelWithdrawalResponse>>(`/v1/withdrawals/${id}`);
  return mapWithdrawalResponse(response.data.data);
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
