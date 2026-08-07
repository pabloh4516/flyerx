// ===== User Types =====
export interface User {
  id: string;
  email: string;
  name: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  phone?: string;
  kycLevel: 'NONE' | 'BASIC' | 'VERIFIED' | 'FULL';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user?: User;
  tokens?: AuthTokens;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

// ===== Wallet Types =====
export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  reservedBalance: number;
  blockedBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  available: number;
  reserved: number;
  blocked: number;
  total: number;
}

// ===== Transaction Types =====
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';
export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  fee: number;
  netAmount: number;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

// ===== Deposit Types =====
export interface Deposit extends Transaction {
  type: 'DEPOSIT';
  pixCopyPaste?: string;
  qrCodeBase64?: string;
  qrCodeUrl?: string;
  expiresAt: string;
}

// ===== Withdrawal Types =====
export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

export interface Withdrawal extends Transaction {
  type: 'WITHDRAWAL';
  pixKeyType: PixKeyType;
  pixKey: string;
}

export interface EstimateFeeResponse {
  amount: number;
  fee: number;
  netAmount: number;
  estimatedTime: string;
}

// ===== Pagination Types =====
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
