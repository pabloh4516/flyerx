import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  mockUsers,
  mockBalance,
  mockTransactions,
  mockDevices,
  generateMockDeposit,
  generateMockWithdrawal,
  estimateFee,
  generateTwoFactorSetup,
  generateMockTokens,
  // Pix2Depix mocks
  generateMockPix2DepixDeposit,
  getMockPix2DepixDepositStatus,
  generateMockPix2DepixWithdraw,
  getMockPix2DepixWithdrawStatus,
  getMockPix2DepixUserInfo,
} from './mock-data';

// Estado do mock
let currentUser: typeof mockUsers[string]['user'] | null = null;
let twoFactorPending: { email: string; token: string } | null = null;

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

// Handler de rotas mock
const handleMockRequest = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const { url, method, data } = config;
  const body = typeof data === 'string' ? JSON.parse(data) : data;

  await delay(300 + Math.random() * 200); // 300-500ms delay

  // ===== AUTH =====

  // Login
  if (url?.includes('/auth/login') && method === 'post') {
    const { email, password } = body;
    const userData = mockUsers[email];

    if (!userData || userData.password !== password) {
      throw mockError('Email ou senha inválidos', 401);
    }

    // Se tem 2FA habilitado
    if (userData.user.twoFactorEnabled) {
      const token = `2fa-${Date.now()}`;
      twoFactorPending = { email, token };
      return mockResponse({
        requiresTwoFactor: true,
        twoFactorToken: token,
      });
    }

    currentUser = userData.user;
    return mockResponse({
      user: userData.user,
      tokens: generateMockTokens(),
    });
  }

  // Verificar 2FA
  if (url?.includes('/auth/2fa/verify') && method === 'post') {
    const { twoFactorToken, code } = body;

    if (!twoFactorPending || twoFactorPending.token !== twoFactorToken) {
      throw mockError('Token inválido', 400);
    }

    // Aceita qualquer código de 6 dígitos em dev
    if (code.length !== 6) {
      throw mockError('Código inválido', 400);
    }

    const userData = mockUsers[twoFactorPending.email];
    currentUser = userData.user;
    twoFactorPending = null;

    return mockResponse({
      user: userData.user,
      tokens: generateMockTokens(),
    });
  }

  // Registro
  if (url?.includes('/auth/register') && method === 'post') {
    const { email, name, document, documentType, phone } = body;

    if (mockUsers[email]) {
      throw mockError('Email já cadastrado', 409);
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      document,
      documentType,
      phone,
      kycLevel: 'NONE' as const,
      status: 'PENDING' as const,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return mockResponse(newUser);
  }

  // Me
  if (url?.includes('/auth/me') && method === 'get') {
    if (!currentUser) {
      // Tenta recuperar do primeiro usuário mock
      currentUser = mockUsers['user@flyerx.com'].user;
    }
    return mockResponse(currentUser);
  }

  // Logout
  if (url?.includes('/auth/logout') && method === 'post') {
    currentUser = null;
    return mockResponse(null);
  }

  // Forgot Password
  if (url?.includes('/auth/forgot-password') && method === 'post') {
    return mockResponse(null);
  }

  // Verify Email
  if (url?.includes('/auth/verify-email') && method === 'post') {
    return mockResponse(null);
  }

  // Change Password
  if (url?.includes('/auth/change-password') && method === 'post') {
    return mockResponse(null);
  }

  // 2FA Setup
  if (url?.includes('/auth/2fa/setup') && method === 'post') {
    return mockResponse(generateTwoFactorSetup());
  }

  // 2FA Confirm
  if (url?.includes('/auth/2fa/confirm') && method === 'post') {
    if (currentUser) {
      currentUser.twoFactorEnabled = true;
    }
    return mockResponse({
      backupCodes: generateTwoFactorSetup().backupCodes,
    });
  }

  // 2FA Disable
  if (url?.includes('/auth/2fa/disable') && method === 'post') {
    if (currentUser) {
      currentUser.twoFactorEnabled = false;
    }
    return mockResponse(null);
  }

  // Devices
  if (url?.includes('/auth/devices') && method === 'get') {
    return mockResponse(mockDevices);
  }

  if (url?.match(/\/auth\/devices\/[\w-]+/) && method === 'delete') {
    return mockResponse(null);
  }

  // ===== WALLET =====

  // Balance
  if (url?.includes('/wallet/balance') && method === 'get') {
    return mockResponse(mockBalance);
  }

  // Wallet info
  if (url?.includes('/wallet') && method === 'get' && !url.includes('balance')) {
    return mockResponse({
      id: 'wallet-001',
      userId: currentUser?.id || 'user-001',
      availableBalance: mockBalance.available,
      reservedBalance: mockBalance.reserved,
      blockedBalance: mockBalance.blocked,
      currency: 'BRL',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: new Date().toISOString(),
    });
  }

  // ===== DEPOSITS =====

  // Create deposit
  if (url?.includes('/deposits') && method === 'post' && !url.includes('estimate')) {
    const { amount } = body;
    const deposit = generateMockDeposit(amount);
    return mockResponse({ deposit });
  }

  // Get deposit
  if (url?.match(/\/deposits\/[\w-]+/) && method === 'get') {
    const depositId = url.split('/').pop();
    const deposit = mockTransactions.find((t) => t.id === depositId && t.type === 'DEPOSIT');
    if (deposit) {
      return mockResponse(deposit);
    }
    // Simula depósito pendente virando completo após alguns segundos
    return mockResponse({
      id: depositId,
      type: 'DEPOSIT',
      status: Math.random() > 0.7 ? 'COMPLETED' : 'PENDING',
      amount: 1000,
      fee: 0,
      netAmount: 1000,
      createdAt: new Date().toISOString(),
    });
  }

  // ===== WITHDRAWALS =====

  // Estimate fee
  if (url?.includes('/withdrawals/estimate-fee') && method === 'post') {
    const { amount } = body;
    return mockResponse(estimateFee(amount));
  }

  // Create withdrawal
  if (url?.includes('/withdrawals') && method === 'post') {
    const { amount, pixKeyType, pixKey } = body;
    const withdrawal = generateMockWithdrawal(amount, pixKeyType, pixKey);
    return mockResponse(withdrawal);
  }

  // ===== TRANSACTIONS =====

  // List transactions
  if (url?.includes('/transactions') && method === 'get') {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '10');
    const type = params.get('type');
    const status = params.get('status');

    let filtered = [...mockTransactions];

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return mockResponse({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  // ===== PIX2DEPIX =====

  // Create Pix2Depix deposit
  if (url?.includes('/pix2depix/deposit') && method === 'post') {
    const { amountInCents, endUserTaxNumber } = body;
    const deposit = generateMockPix2DepixDeposit(amountInCents, endUserTaxNumber);
    return mockResponse(deposit);
  }

  // Get Pix2Depix deposit status
  if (url?.includes('/pix2depix/deposit-status') && method === 'get') {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const id = params.get('id') || '';
    const status = getMockPix2DepixDepositStatus(id);
    return mockResponse(status);
  }

  // Create Pix2Depix withdraw
  if (url?.includes('/pix2depix/withdraw') && method === 'post' && !url.includes('status')) {
    const { pixKey, taxNumber, euid, depositAmountInCents, payoutAmountInCents } = body;
    const amountInCents = payoutAmountInCents || depositAmountInCents;
    const isPayoutAmount = !!payoutAmountInCents;
    const withdrawal = generateMockPix2DepixWithdraw(
      pixKey,
      taxNumber,
      euid,
      amountInCents,
      isPayoutAmount
    );
    return mockResponse(withdrawal);
  }

  // Get Pix2Depix withdraw status
  if (url?.includes('/pix2depix/withdraw-status') && method === 'get') {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const id = params.get('id') || '';
    const status = getMockPix2DepixWithdrawStatus(id);
    return mockResponse(status);
  }

  // Get Pix2Depix user info
  if (url?.includes('/pix2depix/user-info') && method === 'get') {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const euid = params.get('euid') || '';
    const userInfo = getMockPix2DepixUserInfo(euid);
    return mockResponse(userInfo);
  }

  // Fallback
  console.warn(`[Mock API] Unhandled request: ${method?.toUpperCase()} ${url}`);
  return mockResponse(null);
};

// Instala o interceptador mock
export const installMockInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(async (config) => {
    // Substitui a requisição real pelo mock
    const response = await handleMockRequest(config);

    // Cria um adapter que retorna a resposta mock
    config.adapter = () => Promise.resolve(response);

    return config;
  });

  console.log('🔧 Mock API enabled - using fake data for development');
};

export const isMockEnabled = () => {
  return process.env.NEXT_PUBLIC_MOCK_API === 'true';
};
