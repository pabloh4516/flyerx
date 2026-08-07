// ===== Admin User Types =====
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'SUPPORT';
  permissions: string[];
  createdAt: string;
}

// ===== User Types (for managing users) =====
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
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Transaction Types =====
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';
export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'MANUAL_REVIEW';

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  fee: number;
  netAmount: number;
  pixKey?: string;
  pixKeyType?: string;
  createdAt: string;
  completedAt?: string;
}

// ===== KYC Types =====
export interface KYCRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentLevel: string;
  requestedLevel: string;
  documents: {
    type: string;
    url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ===== Fee Types =====
export interface FeeConfig {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  minAmount: number;
  maxAmount: number;
  fixedFee: number;
  percentageFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Audit Types =====
export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

// ===== Dashboard Stats =====
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalDepositAmount: number;
  totalWithdrawals: number;
  totalWithdrawalAmount: number;
  pendingKYC: number;
  pendingWithdrawals: number;
}

// ===== Pagination =====
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
