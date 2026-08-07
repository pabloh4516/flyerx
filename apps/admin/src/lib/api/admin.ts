import api, { setToken, clearToken } from './client';
import type {
  AdminUser,
  User,
  Transaction,
  KYCRequest,
  FeeConfig,
  AuditLog,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// ===== Auth =====

export const adminLogin = async (email: string, password: string): Promise<AdminUser> => {
  const response = await api.post<ApiResponse<{ user: AdminUser; token: string }>>('/auth/login', {
    email,
    password,
  });
  setToken(response.data.data.token);
  return response.data.data.user;
};

export const adminLogout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearToken();
  }
};

export const getAdminMe = async (): Promise<AdminUser> => {
  const response = await api.get<ApiResponse<AdminUser>>('/auth/me');
  return response.data.data;
};

// ===== Dashboard =====

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return response.data.data;
};

// ===== Users =====

export const listUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  kycLevel?: string;
}): Promise<PaginatedResponse<User>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
  return response.data.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get<ApiResponse<User>>(`/users/${id}`);
  return response.data.data;
};

export const updateUserStatus = async (id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<User> => {
  const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
  return response.data.data;
};

export const updateUserKYC = async (id: string, kycLevel: string): Promise<User> => {
  const response = await api.patch<ApiResponse<User>>(`/users/${id}/kyc`, { kycLevel });
  return response.data.data;
};

// ===== Transactions =====

export const listTransactions = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<Transaction>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Transaction>>>('/transactions', {
    params,
  });
  return response.data.data;
};

export const getTransaction = async (id: string): Promise<Transaction> => {
  const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
  return response.data.data;
};

export const approveWithdrawal = async (id: string): Promise<Transaction> => {
  const response = await api.post<ApiResponse<Transaction>>(`/transactions/${id}/approve`);
  return response.data.data;
};

export const rejectWithdrawal = async (id: string, reason: string): Promise<Transaction> => {
  const response = await api.post<ApiResponse<Transaction>>(`/transactions/${id}/reject`, {
    reason,
  });
  return response.data.data;
};

// ===== KYC =====

export const listKYCRequests = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<KYCRequest>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<KYCRequest>>>('/kyc', { params });
  return response.data.data;
};

export const approveKYC = async (id: string): Promise<KYCRequest> => {
  const response = await api.post<ApiResponse<KYCRequest>>(`/kyc/${id}/approve`);
  return response.data.data;
};

export const rejectKYC = async (id: string, reason: string): Promise<KYCRequest> => {
  const response = await api.post<ApiResponse<KYCRequest>>(`/kyc/${id}/reject`, { reason });
  return response.data.data;
};

// ===== Fees =====

export const listFees = async (): Promise<FeeConfig[]> => {
  const response = await api.get<ApiResponse<FeeConfig[]>>('/fees');
  return response.data.data;
};

export const updateFee = async (id: string, data: Partial<FeeConfig>): Promise<FeeConfig> => {
  const response = await api.patch<ApiResponse<FeeConfig>>(`/fees/${id}`, data);
  return response.data.data;
};

// ===== Audit =====

export const listAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<AuditLog>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit', { params });
  return response.data.data;
};

export * from './client';
