import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'flyerx_access_token',
  REFRESH_TOKEN: 'flyerx_refresh_token',
};

// Funções de armazenamento seguro
export const setTokens = async (access: string, refresh: string) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
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
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
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
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      await clearTokens();
      return Promise.reject(error);
    }

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
      const currentRefreshToken = await getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_BASE_URL}/v1/auth/refresh`,
        { refreshToken: currentRefreshToken }
      );

      const { accessToken, refreshToken } = response.data.data;
      await setTokens(accessToken, refreshToken);

      isRefreshing = false;
      onTokenRefreshed(accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      await clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

// Helper para gerar idempotency key
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export default api;
