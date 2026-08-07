import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  mockAdmins,
  mockUsers,
  mockTransactions,
  mockKYCRequests,
  mockFeeConfigs,
  mockAuditLogs,
  mockDashboardStats,
} from './mock-data';

// Estado do mock
let currentAdmin: typeof mockAdmins[string]['admin'] | null = null;

// Simula delay de rede
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cria resposta mock
const mockResponse = <T>(data: T, status = 200): AxiosResponse<{ success: boolean; data: T }> => ({
  data: { success: true, data },
  status,
  statusText: 'OK',
  headers: {},
  config: {} as InternalAxiosRequestConfig,
});

// Cria erro mock
const mockError = (message: string, status = 400) => {
  const error = new Error(message) as Error & { response?: { status: number; data: unknown } };
  error.response = {
    status,
    data: { success: false, error: { code: 'ERROR', message } },
  };
  return error;
};

// Paginar resultados
const paginate = <T>(items: T[], page = 1, limit = 10) => {
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Handler de rotas mock
const handleMockRequest = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const { url, method, data, params } = config;
  const body = typeof data === 'string' ? JSON.parse(data) : data;

  await delay(200 + Math.random() * 200); // 200-400ms delay

  // ===== AUTH =====

  // Login
  if (url?.includes('/auth/login') && method === 'post') {
    const { email, password } = body;
    const adminData = mockAdmins[email];

    if (!adminData || adminData.password !== password) {
      throw mockError('Email ou senha inválidos', 401);
    }

    currentAdmin = adminData.admin;
    return mockResponse({
      user: adminData.admin,
      token: `mock-token-${Date.now()}`,
    });
  }

  // Me
  if (url?.includes('/auth/me') && method === 'get') {
    if (!currentAdmin) {
      currentAdmin = mockAdmins['admin@flyerx.com'].admin;
    }
    return mockResponse(currentAdmin);
  }

  // Logout
  if (url?.includes('/auth/logout') && method === 'post') {
    currentAdmin = null;
    return mockResponse(null);
  }

  // ===== DASHBOARD =====

  if (url?.includes('/dashboard/stats') && method === 'get') {
    return mockResponse(mockDashboardStats);
  }

  // ===== USERS =====

  // List users
  if (url?.includes('/users') && method === 'get' && !url.match(/\/users\/[\w-]+/)) {
    const page = parseInt(params?.page || '1');
    const limit = parseInt(params?.limit || '10');
    const search = params?.search?.toLowerCase();
    const status = params?.status;
    const kycLevel = params?.kycLevel;

    let filtered = [...mockUsers];

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.document.includes(search)
      );
    }
    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }
    if (kycLevel) {
      filtered = filtered.filter((u) => u.kycLevel === kycLevel);
    }

    return mockResponse(paginate(filtered, page, limit));
  }

  // Get user
  if (url?.match(/\/users\/[\w-]+/) && method === 'get') {
    const userId = url.split('/').pop();
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      throw mockError('Usuário não encontrado', 404);
    }
    return mockResponse(user);
  }

  // Update user status
  if (url?.match(/\/users\/[\w-]+\/status/) && method === 'patch') {
    const userId = url.split('/')[url.split('/').indexOf('users') + 1];
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      throw mockError('Usuário não encontrado', 404);
    }
    user.status = body.status;
    return mockResponse(user);
  }

  // Update user KYC
  if (url?.match(/\/users\/[\w-]+\/kyc/) && method === 'patch') {
    const userId = url.split('/')[url.split('/').indexOf('users') + 1];
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      throw mockError('Usuário não encontrado', 404);
    }
    user.kycLevel = body.kycLevel;
    return mockResponse(user);
  }

  // ===== TRANSACTIONS =====

  // List transactions
  if (url?.includes('/transactions') && method === 'get' && !url.match(/\/transactions\/[\w-]+/)) {
    const page = parseInt(params?.page || '1');
    const limit = parseInt(params?.limit || '10');
    const type = params?.type;
    const status = params?.status;

    let filtered = [...mockTransactions];

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    return mockResponse(paginate(filtered, page, limit));
  }

  // Get transaction
  if (url?.match(/\/transactions\/[\w-]+$/) && method === 'get') {
    const txnId = url.split('/').pop();
    const txn = mockTransactions.find((t) => t.id === txnId);
    if (!txn) {
      throw mockError('Transação não encontrada', 404);
    }
    return mockResponse(txn);
  }

  // Approve withdrawal
  if (url?.match(/\/transactions\/[\w-]+\/approve/) && method === 'post') {
    const txnId = url.split('/')[url.split('/').indexOf('transactions') + 1];
    const txn = mockTransactions.find((t) => t.id === txnId);
    if (!txn) {
      throw mockError('Transação não encontrada', 404);
    }
    txn.status = 'PROCESSING';
    return mockResponse(txn);
  }

  // Reject withdrawal
  if (url?.match(/\/transactions\/[\w-]+\/reject/) && method === 'post') {
    const txnId = url.split('/')[url.split('/').indexOf('transactions') + 1];
    const txn = mockTransactions.find((t) => t.id === txnId);
    if (!txn) {
      throw mockError('Transação não encontrada', 404);
    }
    txn.status = 'CANCELLED';
    return mockResponse(txn);
  }

  // ===== KYC =====

  // List KYC
  if (url?.includes('/kyc') && method === 'get' && !url.match(/\/kyc\/[\w-]+/)) {
    const page = parseInt(params?.page || '1');
    const limit = parseInt(params?.limit || '10');
    const status = params?.status;

    let filtered = [...mockKYCRequests];

    if (status) {
      filtered = filtered.filter((k) => k.status === status);
    }

    return mockResponse(paginate(filtered, page, limit));
  }

  // Approve KYC
  if (url?.match(/\/kyc\/[\w-]+\/approve/) && method === 'post') {
    const kycId = url.split('/')[url.split('/').indexOf('kyc') + 1];
    const kyc = mockKYCRequests.find((k) => k.id === kycId);
    if (!kyc) {
      throw mockError('Solicitação não encontrada', 404);
    }
    kyc.status = 'APPROVED';
    kyc.reviewedAt = new Date().toISOString();
    kyc.reviewedBy = currentAdmin?.name;
    return mockResponse(kyc);
  }

  // Reject KYC
  if (url?.match(/\/kyc\/[\w-]+\/reject/) && method === 'post') {
    const kycId = url.split('/')[url.split('/').indexOf('kyc') + 1];
    const kyc = mockKYCRequests.find((k) => k.id === kycId);
    if (!kyc) {
      throw mockError('Solicitação não encontrada', 404);
    }
    kyc.status = 'REJECTED';
    kyc.reviewedAt = new Date().toISOString();
    kyc.reviewedBy = currentAdmin?.name;
    return mockResponse(kyc);
  }

  // ===== FEES =====

  // List fees
  if (url?.includes('/fees') && method === 'get') {
    return mockResponse(mockFeeConfigs);
  }

  // Update fee
  if (url?.match(/\/fees\/[\w-]+/) && method === 'patch') {
    const feeId = url.split('/').pop();
    const fee = mockFeeConfigs.find((f) => f.id === feeId);
    if (!fee) {
      throw mockError('Taxa não encontrada', 404);
    }
    Object.assign(fee, body);
    fee.updatedAt = new Date().toISOString();
    return mockResponse(fee);
  }

  // ===== AUDIT =====

  // List audit logs
  if (url?.includes('/audit') && method === 'get') {
    const page = parseInt(params?.page || '1');
    const limit = parseInt(params?.limit || '10');
    const adminId = params?.adminId;
    const action = params?.action;

    let filtered = [...mockAuditLogs];

    if (adminId) {
      filtered = filtered.filter((a) => a.adminId === adminId);
    }
    if (action) {
      filtered = filtered.filter((a) => a.action === action);
    }

    return mockResponse(paginate(filtered, page, limit));
  }

  // Fallback
  console.warn(`[Mock API] Unhandled request: ${method?.toUpperCase()} ${url}`);
  return mockResponse(null);
};

// Instala o interceptador mock
export const installMockInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(async (config) => {
    const response = await handleMockRequest(config);
    config.adapter = () => Promise.resolve(response);
    return config;
  });

  console.log('🔧 Mock API enabled - using fake data for development');
};

export const isMockEnabled = () => {
  return process.env.NEXT_PUBLIC_MOCK_API === 'true';
};
