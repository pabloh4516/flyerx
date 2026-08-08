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
  full_name: string;
  phone?: string;
  accept_terms?: boolean;
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
  try {
    const response = await api.post<ApiResponse<User>>('/v1/auth/register', data);
    return response.data.data;
  } catch (error: unknown) {
    // Extrair mensagem de erro do response
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      // Se há erros de validação, pegar a primeira mensagem
      if (axiosError.response?.data?.errors) {
        const firstError = Object.values(axiosError.response.data.errors)[0];
        if (firstError && firstError[0]) {
          throw new Error(firstError[0]);
        }
      }
      const message = axiosError.response?.data?.message || 'Erro ao criar conta';
      throw new Error(message);
    }
    throw error;
  }
};

// Interface para resposta real da API (snake_case do Laravel)
interface LaravelLoginResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    status: string;
    kyc_level: string;
    two_factor_enabled: boolean;
  };
  requires_two_factor?: boolean;
  two_factor_token?: string;
  message?: string;
}

// Login
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    // A API retorna diretamente os dados, não encapsulados em { data: ... }
    const response = await api.post<LaravelLoginResponse>('/v1/auth/login', data);
    const result = response.data;

    // Se requer 2FA
    if (result.requires_two_factor && result.two_factor_token) {
      return {
        requiresTwoFactor: true,
        twoFactorToken: result.two_factor_token,
      };
    }

    // Se tem tokens (login bem sucedido)
    if (result.access_token && result.refresh_token) {
      setTokens(result.access_token, result.refresh_token);

      // Mapear user do snake_case para camelCase
      const user = result.user ? {
        id: result.user.id,
        email: result.user.email,
        name: result.user.full_name,
        document: '',
        documentType: 'CPF' as const,
        kycLevel: (String(result.user.kyc_level || 'NONE').toUpperCase()) as 'NONE' | 'BASIC' | 'VERIFIED' | 'FULL',
        status: (String(result.user.status || 'ACTIVE').toUpperCase()) as 'ACTIVE' | 'BLOCKED' | 'PENDING',
        twoFactorEnabled: result.user.two_factor_enabled || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : undefined;

      return {
        user,
        tokens: {
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expiresIn: result.expires_in || 3600,
        },
      };
    }

    // Resposta inesperada
    throw new Error('Resposta inesperada do servidor');
  } catch (error: unknown) {
    // Extrair mensagem de erro do response
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string; error?: { message?: string } } } };
      const message = axiosError.response?.data?.message
        || axiosError.response?.data?.error?.message
        || 'Credenciais inválidas';
      throw new Error(message);
    }
    throw error;
  }
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
