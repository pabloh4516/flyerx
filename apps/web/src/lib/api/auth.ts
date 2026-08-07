import api, { setTokens, clearTokens } from './client';
import type {
  User,
  LoginResponse,
  ApiResponse,
  TwoFactorSetup,
  Device,
} from '@/types';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyTwoFactorRequest {
  twoFactorToken: string;
  code: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Registro
export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<ApiResponse<User>>('/v1/auth/register', data);
  return response.data.data;
};

// Login
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/login', data);
  const result = response.data.data;

  // Se não requer 2FA, salvar tokens
  if (result.tokens && !result.requiresTwoFactor) {
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
  }

  return result;
};

// Verificar 2FA no login
export const verifyTwoFactor = async (data: VerifyTwoFactorRequest): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/v1/auth/2fa/verify', data);
  const result = response.data.data;

  if (result.tokens) {
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
  }

  return result;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await api.post('/v1/auth/logout');
  } finally {
    clearTokens();
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

// Resetar senha
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await api.post('/v1/auth/reset-password', data);
};

// Verificar email
export const verifyEmail = async (token: string): Promise<void> => {
  await api.post('/v1/auth/verify-email', { token });
};

// Reenviar email de verificação
export const resendVerificationEmail = async (): Promise<void> => {
  await api.post('/v1/auth/resend-verification');
};

// Alterar senha
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await api.post('/v1/auth/change-password', data);
};

// ===== 2FA =====

// Iniciar setup do 2FA
export const setupTwoFactor = async (): Promise<TwoFactorSetup> => {
  const response = await api.post<ApiResponse<TwoFactorSetup>>('/v1/auth/2fa/setup');
  return response.data.data;
};

// Confirmar setup do 2FA
export const confirmTwoFactor = async (code: string): Promise<{ backupCodes: string[] }> => {
  const response = await api.post<ApiResponse<{ backupCodes: string[] }>>('/v1/auth/2fa/confirm', {
    code,
  });
  return response.data.data;
};

// Desabilitar 2FA
export const disableTwoFactor = async (code: string): Promise<void> => {
  await api.post('/v1/auth/2fa/disable', { code });
};

// Gerar novos backup codes
export const regenerateBackupCodes = async (code: string): Promise<{ backupCodes: string[] }> => {
  const response = await api.post<ApiResponse<{ backupCodes: string[] }>>(
    '/v1/auth/2fa/backup-codes',
    { code }
  );
  return response.data.data;
};

// ===== Dispositivos =====

// Listar dispositivos
export const listDevices = async (): Promise<Device[]> => {
  const response = await api.get<ApiResponse<Device[]>>('/v1/auth/devices');
  return response.data.data;
};

// Revogar dispositivo
export const revokeDevice = async (deviceId: string): Promise<void> => {
  await api.delete(`/v1/auth/devices/${deviceId}`);
};

// Revogar todos os dispositivos exceto o atual
export const revokeAllDevices = async (): Promise<void> => {
  await api.post('/v1/auth/devices/revoke-all');
};
