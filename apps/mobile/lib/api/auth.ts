import api, { setTokens, clearTokens } from './client';
import type { User, LoginResponse, ApiResponse } from '../../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyTwoFactorRequest {
  twoFactorToken: string;
  code: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  phone?: string;
}

// Login
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/login', data);
  const result = response.data.data;

  if (result.tokens && !result.requiresTwoFactor) {
    await setTokens(result.tokens.accessToken, result.tokens.refreshToken);
  }

  return result;
};

// Verificar 2FA no login
export const verifyTwoFactor = async (data: VerifyTwoFactorRequest): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/2fa/verify', data);
  const result = response.data.data;

  if (result.tokens) {
    await setTokens(result.tokens.accessToken, result.tokens.refreshToken);
  }

  return result;
};

// Registro
export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<ApiResponse<User>>('/v1/auth/register', data);
  return response.data.data;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post('/v1/auth/logout');
  } finally {
    await clearTokens();
  }
};

// Obter usuário atual
export const getMe = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/v1/auth/me');
  return response.data.data;
};

// Solicitar recuperação de senha
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/v1/auth/forgot-password', { email });
};
