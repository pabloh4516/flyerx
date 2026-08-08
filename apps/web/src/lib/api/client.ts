import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types';
import { installMockInterceptor, isMockEnabled } from './mock-api';

/**
 * URL base da API
 *
 * Em produção: usa '/api' (proxy local que adiciona Gateway Key)
 * Em desenvolvimento com mock: usa '/api' (interceptado pelo mock)
 * Em desenvolvimento sem mock: usa NEXT_PUBLIC_API_URL direto (para debug)
 */
const API_BASE_URL = (() => {
  // Se mock está habilitado, usar /api (será interceptado)
  if (typeof window !== 'undefined' && isMockEnabled()) {
    return '/api';
  }

  // Em produção, SEMPRE usar proxy local
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }

  // Em dev sem mock, pode usar Laravel direto (se quiser debug)
  // Mas o padrão é usar proxy também
  return process.env.NEXT_PUBLIC_API_URL || '/api';
})();

// Tokens em memória (mais seguro que localStorage)
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    // Salvar em sessionStorage (para o client)
    sessionStorage.setItem('accessToken', access);
    sessionStorage.setItem('refreshToken', refresh);
    // Salvar em cookie (para o middleware verificar)
    document.cookie = `accessToken=${access}; path=/; max-age=86400; SameSite=Strict`;
  }
};

export const getAccessToken = () => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = sessionStorage.getItem('accessToken');
  }
  return accessToken;
};

export const getRefreshToken = () => {
  if (refreshToken) return refreshToken;
  if (typeof window !== 'undefined') {
    refreshToken = sessionStorage.getItem('refreshToken');
  }
  return refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    // Limpar cookie
    document.cookie = 'accessToken=; path=/; max-age=0';
  }
};

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Flag para evitar múltiplos refreshes simultâneos
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refresh token automático
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Se não for erro 401 ou não tiver config, rejeitar
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Não interceptar endpoints de autenticação (login, register, refresh, etc.)
    // Esses endpoints devem tratar seus próprios erros 401
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Se já está refreshing, aguardar
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
        refreshToken: currentRefreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
      setTokens(newAccessToken, newRefreshToken);

      isRefreshing = false;
      onTokenRefreshed(newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

// Helper para gerar idempotency key
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Instalar mock SOMENTE se NEXT_PUBLIC_MOCK_API=true
if (typeof window !== 'undefined' && isMockEnabled()) {
  installMockInterceptor(api);
}

export default api;
