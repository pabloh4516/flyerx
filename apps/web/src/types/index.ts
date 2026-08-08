// ===== User Types =====
export type KYCLevel = 'NONE' | 'BASIC' | 'VERIFIED' | 'FULL';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

export interface User {
  id: string;
  email: string;
  name: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  phone?: string;
  kycLevel: KYCLevel;
  status: UserStatus;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  // Pix2Depix/Liquid integration
  depixAddress?: string;  // Endereço Liquid para receber DePix
  euid?: string;          // Eulen User ID (EU + 15 dígitos)
  // Acesso direto à Eulen (sem taxa do parceiro, saque rápido)
  useDirectEulen?: boolean;
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

/**
 * Status de transação — Mapeamento completo
 *
 * PENDING: Aguardando processamento inicial
 * AWAITING_PAYMENT: Depósito aguardando pagamento PIX
 * PROCESSING: Em processamento
 * UNDER_REVIEW: Em análise de compliance (Eulen under_review)
 * DELAYED: Processamento atrasado (Eulen delayed/QR Delay)
 * COMPLETED: Concluído com sucesso
 * FAILED: Falhou
 * CANCELLED: Cancelado
 * EXPIRED: Expirado (QR Code não pago)
 * REFUNDED: Devolvido ao pagador/remetente
 * REJECTED: Rejeitado (compliance/validação)
 */
export type TransactionStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'UNDER_REVIEW'
  | 'DELAYED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'REJECTED';

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
  // Dados do pagador (disponíveis após confirmação)
  payerName?: string;
  payerTaxNumber?: string;
  payerEuid?: string;
  // ID da transação bancária
  bankTxId?: string;
}

export interface CreateDepositRequest {
  amount: number;
  payer_tax_number: string; // CPF/CNPJ do pagador (obrigatório pela Eulen)
  depix_address?: string;   // Endereço Liquid para receber DePix
  euid?: string;            // EUID do usuário na Eulen
  split_address?: string;   // Endereço para split (comissão)
  split_fee?: string;       // Porcentagem do split (ex: "0.02")
}

export interface CreateDepositResponse {
  deposit: Deposit;
}

// ===== Withdrawal Types =====
// IMPORTANTE: valores em minúsculas para compatibilidade com enum Laravel
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface Withdrawal extends Transaction {
  type: 'WITHDRAWAL';
  pixKeyType: PixKeyType;
  pixKey: string;
  recipientName?: string;
  recipientDocument?: string;
  // Campos adicionais da API
  endToEndId?: string;      // E2E ID do PIX (centralBankId)
  receiptUrl?: string;       // URL do comprovante bancário
  liquidAddress?: string;    // Endereço Liquid (para saques DePix)
  transferDate?: string;     // Data da transferência
}

export interface CreateWithdrawalRequest {
  pix_key: string;
  pix_key_type: PixKeyType;
  amount: number;                    // Valor do saque em reais
  recipient_name?: string;           // Nome do beneficiário (opcional)
  recipient_document?: string;       // CPF/CNPJ do beneficiário (opcional, mas necessário para Eulen)
}

export interface EstimateFeeRequest {
  amount: number;
}

export interface EstimateFeeResponse {
  amount: number;
  fee: number;
  netAmount: number;
  estimatedTime: string;
}

// ===== 2FA Types =====
export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface Device {
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

// ===== Pagination Types =====
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ===== Filter Types =====
export interface TransactionFilters extends PaginatedRequest {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ===== KYC Request Types =====
export type KYCRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';

export interface KYCDocument {
  id: string;
  type: 'CNH_FRONT' | 'CNH_BACK' | 'RG_FRONT' | 'RG_BACK' | 'SELFIE' | 'PROOF_OF_ADDRESS';
  url?: string;
  uploadedAt: string;
  fileSize?: number;
  validations: {
    ocrValid?: boolean;
    noTampering?: boolean;
    facialMatch?: number;
    livenessCheck?: boolean;
  };
}

export interface KYCVerification {
  type: 'RECEITA_FEDERAL' | 'RESTRICTED_LISTS' | 'PEP' | 'DEVICE';
  status: 'PASSED' | 'FAILED' | 'WARNING' | 'PENDING';
  message: string;
  checkedAt?: string;
}

export interface KYCRequest {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    document: string;
    phone?: string;
    createdAt: string;
  };
  currentLevel: KYCLevel;
  requestedLevel: KYCLevel;
  status: KYCRequestStatus;
  identityScore: number;
  biometricMatch?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  documents: KYCDocument[];
  verifications: KYCVerification[];
  events: KYCEvent[];
  assignedTo?: string;
  internalNotes?: string;
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface KYCEvent {
  id: string;
  type: 'SUBMITTED' | 'ANALYSIS_COMPLETE' | 'ASSIGNED' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUESTED';
  description: string;
  metadata?: Record<string, string>;
  createdAt: string;
  createdBy?: string;
}

export interface KYCLimits {
  depositMonthly: { current: number; upgraded: number };
  withdrawMonthly: { current: number; upgraded: number };
  withdrawPerOperation: { current: number; upgraded: number };
}

export interface KYCQueueStats {
  pending: number;
  today: number;
  avgProcessingTime: string;
}

// ===== Re-export Fee Types =====
export * from './fees';
