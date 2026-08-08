/**
 * Cliente API para o Backend Flyerx (LWK)
 *
 * Este cliente comunica com o backend Python que processa saques
 * com cobrança de taxa de parceiro via LWK (Liquid Wallet Kit).
 *
 * IMPORTANTE: Todas as chamadas passam pelo proxy /api/backend/*
 * que adiciona a INTERNAL_API_KEY server-side. A chave NUNCA
 * é exposta ao browser.
 */

import axios, { AxiosError } from 'axios';

/**
 * URL do backend
 *
 * Em produção: usa /api/backend (proxy local que adiciona API Key)
 * Em desenvolvimento: também usa proxy para consistência
 */
const BACKEND_URL = '/api/backend';

// Cliente Axios configurado
// NOTA: X-API-Key é adicionado pelo proxy server-side
const backendApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor para tratamento de erros
backendApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('flyerx_backend_token');
      }
    }
    return Promise.reject(error);
  }
);

// ===== Tipos =====

export interface FeeBreakdown {
  requested_amount: number;
  partner_fee: number;
  eulen_fee: number;
  total_fee: number;
  total_depix: number;
}

export interface CreateWithdrawalRequest {
  user_id: string;
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  beneficiary_tax_number: string;
  amount_cents: number;
}

export interface WithdrawalResponse {
  id: string;
  status: string;
  flyerx_address: string;
  breakdown: FeeBreakdown;
  pix_key: string;
  pix_key_type: string;
  beneficiary_tax_number: string;
  user_tx_id?: string;
  eulen_withdrawal_id?: string;
  receipt_url?: string;
  created_at: string;
  expires_at?: string;
  completed_at?: string;
}

export interface WithdrawalStatusResponse {
  id: string;
  status: string;
  breakdown: FeeBreakdown;
  user_tx_id?: string;
  receipt_url?: string;
  created_at: string;
  completed_at?: string;
}

export interface WithdrawalListResponse {
  items: WithdrawalResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface EstimateFeeResponse {
  breakdown: FeeBreakdown;
}

export interface DailyLimitResponse {
  tax_number: string;
  daily_limit_cents: number;
  daily_volume_cents: number;
  remaining_cents: number;
  daily_limit_reais: number;
  daily_volume_reais: number;
  remaining_reais: number;
  has_euid: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ===== Funções de Autenticação =====

/**
 * Obtém um token de desenvolvimento (apenas para testes).
 */
export const getDevToken = async (userId: string = 'user-dev'): Promise<TokenResponse> => {
  const response = await backendApi.post<TokenResponse>('/api/v1/auth/dev-token', {
    user_id: userId,
    email: 'dev@flyerx.com',
  });

  // Salvar token
  if (typeof window !== 'undefined') {
    localStorage.setItem('flyerx_backend_token', response.data.access_token);
  }

  return response.data;
};

/**
 * Verifica se há token salvo.
 */
export const hasBackendToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('flyerx_backend_token');
};

/**
 * Remove token salvo.
 */
export const clearBackendToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('flyerx_backend_token');
  }
};

// ===== Funções de Saque =====

/**
 * Cria uma nova solicitação de saque.
 *
 * Retorna o endereço Liquid (flyerx_address) para o usuário enviar DePix.
 */
export const createBackendWithdrawal = async (
  data: CreateWithdrawalRequest
): Promise<WithdrawalResponse> => {
  const response = await backendApi.post<WithdrawalResponse>(
    '/internal/withdrawals',
    data
  );
  return response.data;
};

/**
 * Consulta status detalhado de um saque.
 */
export const getBackendWithdrawal = async (id: string): Promise<WithdrawalResponse> => {
  const response = await backendApi.get<WithdrawalResponse>(
    `/internal/withdrawals/${id}`
  );
  return response.data;
};

/**
 * Consulta status simplificado de um saque (para polling).
 */
export const getBackendWithdrawalStatus = async (
  id: string,
  userId: string = 'anonymous'
): Promise<WithdrawalStatusResponse> => {
  const response = await backendApi.get<WithdrawalStatusResponse>(
    `/internal/withdrawals/${id}/status`,
    { params: { user_id: userId } }
  );
  return response.data;
};

/**
 * Lista saques do usuário.
 */
export const listBackendWithdrawals = async (
  userId: string = 'anonymous',
  params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<WithdrawalListResponse> => {
  const response = await backendApi.get<WithdrawalListResponse>(
    '/internal/withdrawals',
    { params: { user_id: userId, ...params } }
  );
  return response.data;
};

/**
 * Cancela um saque pendente.
 */
export const cancelBackendWithdrawal = async (id: string): Promise<void> => {
  await backendApi.post(`/internal/withdrawals/${id}/cancel`);
};

/**
 * Estima taxas para um saque (não requer autenticação).
 */
export const estimateBackendFee = async (
  amountReais: number
): Promise<EstimateFeeResponse> => {
  const response = await backendApi.post<EstimateFeeResponse>(
    '/internal/withdrawals/estimate-fee',
    { amount_reais: amountReais }
  );
  return response.data;
};

/**
 * Consulta o limite diário disponível para um CPF/CNPJ.
 *
 * Retorna o limite diário, volume utilizado e saldo restante.
 */
export const getDailyLimit = async (
  taxNumber: string
): Promise<DailyLimitResponse> => {
  // Limpar formatação do CPF/CNPJ
  const cleanTax = taxNumber.replace(/[.\-/]/g, '');
  const response = await backendApi.get<DailyLimitResponse>(
    `/internal/withdrawals/limit/${cleanTax}`
  );
  return response.data;
};

// ===== Saque Direto via Eulen (sem taxa de parceiro) =====

export interface DirectEulenWithdrawRequest {
  pixKey: string;
  taxNumber?: string; // CPF/CNPJ do titular (obrigatório se não tiver euid)
  payoutAmountInCents: number;
  euid?: string; // Eulen User ID (obrigatório se não tiver taxNumber)
}

export interface DirectEulenWithdrawResponse {
  withdrawalId: string;
  depositAddress: string;
  depositAmountInCents: number;
  payoutAmountInCents: number;
}

export interface DirectEulenStatusResponse {
  id: string;
  status: string;
  depositAmountInCents: number;
  payoutAmountInCents: number;
  receiptUrl?: string;
}

/**
 * Cria saque direto via Eulen (sem taxa do parceiro).
 * Usado para usuários marcados com useDirectEulen=true.
 */
export const createDirectEulenWithdraw = async (
  data: DirectEulenWithdrawRequest
): Promise<DirectEulenWithdrawResponse> => {
  // Chama nosso proxy que vai para Eulen diretamente
  // Eulen aceita OU taxNumber OU euid, não ambos
  const body: Record<string, unknown> = {
    pixKey: data.pixKey,
    payoutAmountInCents: data.payoutAmountInCents,
  };

  // Adiciona apenas um: euid OU taxNumber
  if (data.euid) {
    body.euid = data.euid;
  } else if (data.taxNumber) {
    body.taxNumber = data.taxNumber;
  }

  const response = await fetch('/api/pix2depix/withdraw?direct=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar saque');
  }

  return response.json();
};

/**
 * Consulta status de saque direto via Eulen.
 */
export const getDirectEulenStatus = async (
  id: string
): Promise<DirectEulenStatusResponse> => {
  const response = await fetch(`/api/pix2depix/withdraw-status?id=${id}&direct=true`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao consultar status');
  }

  return response.json();
};

// ===== Health Check =====

/**
 * Verifica se o backend está online.
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await backendApi.get('/health');
    return response.data.status === 'healthy';
  } catch {
    return false;
  }
};

// ===== Feature Flag =====

/**
 * Verifica se deve usar o novo backend (LWK) ou API Eulen direta.
 *
 * Controlar via variável de ambiente ou flag no localStorage.
 */
export const shouldUseBackendLWK = (): boolean => {
  // Variável de ambiente
  if (process.env.NEXT_PUBLIC_USE_BACKEND_LWK === 'true') {
    return true;
  }

  // Flag local para testes
  if (typeof window !== 'undefined') {
    return localStorage.getItem('use_backend_lwk') === 'true';
  }

  return false;
};

/**
 * Ativa/desativa uso do backend LWK (para testes).
 */
export const setUseBackendLWK = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('use_backend_lwk', 'true');
    } else {
      localStorage.removeItem('use_backend_lwk');
    }
  }
};

export default backendApi;
