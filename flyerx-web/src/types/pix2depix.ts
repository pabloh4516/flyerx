// ===== Pix2Depix API Types =====

// Status de Depósito Pix2Depix
export type Pix2DepixDepositStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'depix_sent'
  | 'delayed'
  | 'expired'
  | 'canceled'
  | 'refunded'
  | 'will_refund'
  | 'error';

// Status de Saque Pix2Depix
export type Pix2DepixWithdrawStatus =
  | 'unsent'
  | 'sending'
  | 'sent'
  | 'error'
  | 'canceled'
  | 'refunded';

// ===== Deposit Types =====

export interface Pix2DepixDepositRequest {
  amountInCents: number;
  endUserTaxNumber: string;
  depixAddress?: string;
  euid?: string;
  // Split parameters - para parceiros receberem comissão
  depixSplitAddress?: string; // Endereço do parceiro para receber split
  splitFee?: string; // Percentual do split (ex: "0.02" = 2%)
}

export interface Pix2DepixDepositResponse {
  id: string;
  qrCopyPaste: string;
  qrImageUrl: string;
}

export interface Pix2DepixDeposit {
  id: string;
  qrCopyPaste: string;
  qrImageUrl: string;
  status: Pix2DepixDepositStatus;
  valueInCents: number;
  expiration: string;
  blockchainTxID?: string;
}

export interface Pix2DepixDepositStatusResponse {
  id: string;
  status: Pix2DepixDepositStatus;
  valueInCents: number;
  expiration: string;
  blockchainTxID?: string;
}

// ===== Withdraw Types =====

export interface Pix2DepixWithdrawRequest {
  pixKey: string;
  taxNumber?: string;
  euid?: string;
  depositAmountInCents?: number;
  payoutAmountInCents?: number;
}

export interface Pix2DepixWithdrawResponse {
  withdrawalId: string;
  depositAddress: string;
  depositAmountInCents: number;
  payoutAmountInCents: number;
}

export interface Pix2DepixWithdraw {
  id: string;
  withdrawalId: string;
  depositAddress: string;
  depositAmountInCents: number;
  payoutAmountInCents: number;
  status: Pix2DepixWithdrawStatus;
  pixKey: string;
  taxNumber: string;
  blockchainTxID?: string;
  receiptUrl?: string;
}

export interface Pix2DepixWithdrawStatusResponse {
  id: string;
  status: Pix2DepixWithdrawStatus;
  depositAmountInCents: number;
  payoutAmountInCents: number;
  blockchainTxID?: string;
  receiptUrl?: string;
}

// ===== User Info Types =====

export interface Pix2DepixUserInfo {
  dailyVolumeInCents: number;
  maxDailyInCents: number;
  isBlocked: boolean;
  dailyLimitResetTime: string;
}

// ===== Helpers =====

// Mapeamento de status Pix2Depix para status interno
export const mapDepositStatus = (status: Pix2DepixDepositStatus): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED' => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return 'PENDING';
    case 'approved':
      return 'PROCESSING';
    case 'depix_sent':
      return 'COMPLETED';
    case 'expired':
      return 'EXPIRED';
    case 'canceled':
    case 'refunded':
    case 'will_refund':
      return 'CANCELLED';
    case 'delayed':
      return 'PROCESSING';
    case 'error':
      return 'FAILED';
    default:
      return 'PENDING';
  }
};

export const mapWithdrawStatus = (status: Pix2DepixWithdrawStatus): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' => {
  switch (status) {
    case 'unsent':
      return 'PENDING';
    case 'sending':
      return 'PROCESSING';
    case 'sent':
      return 'COMPLETED';
    case 'error':
      return 'FAILED';
    case 'canceled':
    case 'refunded':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
};

// Labels para exibição
export const PIX2DEPIX_DEPOSIT_STATUS_LABELS: Record<Pix2DepixDepositStatus, string> = {
  pending: 'Aguardando pagamento',
  under_review: 'Em análise',
  approved: 'Aprovado',
  depix_sent: 'DePix enviado',
  delayed: 'Atrasado',
  expired: 'Expirado',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
  will_refund: 'Será reembolsado',
  error: 'Erro',
};

export const PIX2DEPIX_WITHDRAW_STATUS_LABELS: Record<Pix2DepixWithdrawStatus, string> = {
  unsent: 'Aguardando DePix',
  sending: 'Enviando PIX',
  sent: 'PIX enviado',
  error: 'Erro',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
};

// Conversão centavos <-> reais
export const centsToReais = (cents: number): number => cents / 100;
export const reaisToCents = (reais: number): number => Math.round(reais * 100);
