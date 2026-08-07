import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { installMockInterceptor, isMockEnabled } from './mock-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/admin';

let accessToken: string | null = null;

export const setToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('adminAccessToken', token);
    } else {
      sessionStorage.removeItem('adminAccessToken');
    }
  }
};

export const getToken = () => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = sessionStorage.getItem('adminAccessToken');
  }
  return accessToken;
};

export const clearToken = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('adminAccessToken');
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Instalar mock se habilitado
if (typeof window !== 'undefined' && isMockEnabled()) {
  installMockInterceptor(api);
}

export default api;
