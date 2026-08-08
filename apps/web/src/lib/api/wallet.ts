import api from './client';
import type {
  Wallet,
  Balance,
  ApiResponse,
  Transaction,
  TransactionFilters,
  PaginatedResponse,
} from '@/types';

// Obter dados da carteira
export const getWallet = async (): Promise<Wallet> => {
  const response = await api.get<ApiResponse<Wallet>>('/v1/wallet');
  return response.data.data;
};

// Obter saldos
export const getBalance = async (): Promise<Balance> => {
  const response = await api.get<ApiResponse<Balance>>('/v1/wallet/balance');
  return response.data.data;
};

// Tipo da resposta do Laravel para history
interface LaravelHistoryResponse {
  transactions: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    fee: number;
    net_amount: number;
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Listar transações com filtros
export const listTransactions = async (
  filters?: TransactionFilters
): Promise<PaginatedResponse<Transaction>> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  }

  const response = await api.get<ApiResponse<LaravelHistoryResponse>>(
    `/v1/wallet/history?${params.toString()}`
  );

  // Mapear resposta Laravel para estrutura esperada
  const laravelData = response.data.data;
  const transactions: Transaction[] = laravelData.transactions.map((tx) => ({
    id: tx.id,
    type: tx.type.toUpperCase() as Transaction['type'],
    status: tx.status.toUpperCase() as Transaction['status'],
    amount: tx.amount,
    fee: tx.fee,
    netAmount: tx.net_amount,
    createdAt: tx.created_at,
  }));

  return {
    data: transactions,
    meta: {
      total: laravelData.pagination.total,
      page: laravelData.pagination.page,
      limit: laravelData.pagination.limit,
      totalPages: Math.ceil(laravelData.pagination.total / laravelData.pagination.limit) || 1,
    },
  };
};

// Obter detalhes de uma transação
export const getTransaction = async (id: string): Promise<Transaction> => {
  const response = await api.get<ApiResponse<Transaction>>(`/v1/wallet/history/${id}`);
  return response.data.data;
};

// Exportar transações em CSV
export const exportTransactionsCsv = async (filters?: TransactionFilters): Promise<Blob> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  const response = await api.get(`/v1/wallet/history/export?format=csv&${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Exportar transações em PDF
export const exportTransactionsPdf = async (filters?: TransactionFilters): Promise<Blob> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  const response = await api.get(`/v1/wallet/history/export?format=pdf&${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};
