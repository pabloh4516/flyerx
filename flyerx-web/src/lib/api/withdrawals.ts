import api, { generateIdempotencyKey } from './client';
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

// Estimar taxa de saque
export const estimateWithdrawalFee = async (amount: number): Promise<EstimateFeeResponse> => {
  const response = await api.post<ApiResponse<EstimateFeeResponse>>(
    '/v1/withdrawals/estimate-fee',
    { amount }
  );
  return response.data.data;
};

// Criar saque
export const createWithdrawal = async (
  amount: number,
  pixKeyType: PixKeyType,
  pixKey: string,
  twoFactorCode?: string,
  idempotencyKey?: string
): Promise<Withdrawal> => {
  const response = await api.post<ApiResponse<Withdrawal>>('/v1/withdrawals', {
    amount,
    pixKeyType,
    pixKey,
    twoFactorCode,
    idempotencyKey: idempotencyKey || generateIdempotencyKey(),
  } as CreateWithdrawalRequest);
  return response.data.data;
};

// Obter detalhes do saque
export const getWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await api.get<ApiResponse<Withdrawal>>(`/v1/withdrawals/${id}`);
  return response.data.data;
};

// Listar saques
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

// Cancelar saque pendente (se permitido)
export const cancelWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await api.post<ApiResponse<Withdrawal>>(`/v1/withdrawals/${id}/cancel`);
  return response.data.data;
};

// Validar chave PIX antes de criar saque
export const validatePixKey = async (
  pixKeyType: PixKeyType,
  pixKey: string
): Promise<{
  valid: boolean;
  recipientName?: string;
  recipientDocument?: string;
}> => {
  const response = await api.post<
    ApiResponse<{
      valid: boolean;
      recipientName?: string;
      recipientDocument?: string;
    }>
  >('/v1/withdrawals/validate-pix', { pixKeyType, pixKey });
  return response.data.data;
};
