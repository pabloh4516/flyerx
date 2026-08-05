import type {
  User,
  Balance,
  Transaction,
  Deposit,
  Withdrawal,
  Device,
  TwoFactorSetup,
  EstimateFeeResponse,
} from '@/types';
import type {
  Pix2DepixDepositResponse,
  Pix2DepixDepositStatusResponse,
  Pix2DepixWithdrawResponse,
  Pix2DepixWithdrawStatusResponse,
  Pix2DepixUserInfo,
  Pix2DepixDepositStatus,
  Pix2DepixWithdrawStatus,
} from '@/types/pix2depix';

// ===== Mock Users =====
export const mockUsers: Record<string, { user: User; password: string }> = {
  'henricdm@gmail.com': {
    password: '123456',
    user: {
      id: 'user-henri',
      email: 'henricdm@gmail.com',
      name: 'Henri Duarte Miranda',
      document: '15344601603',
      documentType: 'CPF',
      phone: '11999999999',
      kycLevel: 'VERIFIED',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-01T15:30:00Z',
      euid: 'EU029323097781097', // Eulen User ID para testes Pix2Depix
    },
  },
  'user@flyerx.com': {
    password: '123456',
    user: {
      id: 'user-001',
      email: 'user@flyerx.com',
      name: 'João Silva',
      document: '12345678901',
      documentType: 'CPF',
      phone: '11999999999',
      kycLevel: 'VERIFIED',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-01T15:30:00Z',
    },
  },
  'empresa@flyerx.com': {
    password: '123456',
    user: {
      id: 'user-002',
      email: 'empresa@flyerx.com',
      name: 'Tech Solutions LTDA',
      document: '12345678000199',
      documentType: 'CNPJ',
      phone: '1133334444',
      kycLevel: 'FULL',
      status: 'ACTIVE',
      twoFactorEnabled: true,
      createdAt: '2024-02-20T14:00:00Z',
      updatedAt: '2024-05-15T09:00:00Z',
    },
  },
};

// ===== Mock Balance =====
export const mockBalance: Balance = {
  available: 15750.50,
  reserved: 500.00,
  blocked: 0,
  total: 16250.50,
};

// ===== Mock Transactions =====
export const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 5000.00,
    fee: 0,
    netAmount: 5000.00,
    createdAt: '2024-06-01T10:30:00Z',
    completedAt: '2024-06-01T10:31:00Z',
  },
  {
    id: 'txn-002',
    type: 'WITHDRAWAL',
    status: 'COMPLETED',
    amount: 1500.00,
    fee: 3.50,
    netAmount: 1496.50,
    createdAt: '2024-05-28T14:00:00Z',
    completedAt: '2024-05-28T14:05:00Z',
  },
  {
    id: 'txn-003',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 10000.00,
    fee: 0,
    netAmount: 10000.00,
    createdAt: '2024-05-25T09:15:00Z',
    completedAt: '2024-05-25T09:16:00Z',
  },
  {
    id: 'txn-004',
    type: 'WITHDRAWAL',
    status: 'PENDING',
    amount: 2000.00,
    fee: 4.00,
    netAmount: 1996.00,
    createdAt: '2024-06-02T11:00:00Z',
  },
  {
    id: 'txn-005',
    type: 'DEPOSIT',
    status: 'EXPIRED',
    amount: 500.00,
    fee: 0,
    netAmount: 500.00,
    createdAt: '2024-05-20T16:00:00Z',
  },
];

// ===== Mock Devices =====
export const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: 'Chrome Windows',
    browser: 'Chrome 125',
    os: 'Windows 11',
    ip: '189.100.xxx.xxx',
    lastUsedAt: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: 'device-002',
    name: 'Safari iPhone',
    browser: 'Safari 17',
    os: 'iOS 17.5',
    ip: '189.100.xxx.xxx',
    lastUsedAt: '2024-05-30T08:00:00Z',
    isCurrent: false,
  },
];

// ===== Helper Functions =====
export const generateMockDeposit = (amount: number): Deposit => {
  const id = `dep-${Date.now()}`;
  const pixCode = `00020126580014br.gov.bcb.pix0136${id}520400005303986540${amount.toFixed(2)}5802BR5913FLYERX PAGAMENTOS6008SAOPAULO62070503***6304`;

  return {
    id,
    type: 'DEPOSIT',
    status: 'PENDING',
    amount,
    fee: 0,
    netAmount: amount,
    pixCopyPaste: pixCode,
    qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    createdAt: new Date().toISOString(),
  };
};

export const generateMockWithdrawal = (
  amount: number,
  pixKeyType: string,
  pixKey: string
): Withdrawal => {
  const fee = Math.min(amount * 0.002, 10); // 0.2% max R$10
  return {
    id: `wth-${Date.now()}`,
    type: 'WITHDRAWAL',
    status: 'PROCESSING',
    amount,
    fee,
    netAmount: amount - fee,
    pixKeyType: pixKeyType as Withdrawal['pixKeyType'],
    pixKey,
    createdAt: new Date().toISOString(),
  };
};

export const estimateFee = (amount: number): EstimateFeeResponse => {
  const fee = Math.min(amount * 0.002, 10); // 0.2% max R$10
  return {
    amount,
    fee,
    netAmount: amount - fee,
    estimatedTime: 'Até 1 hora',
  };
};

export const generateTwoFactorSetup = (): TwoFactorSetup => {
  return {
    secret: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: 'otpauth://totp/Flyerx:user@flyerx.com?secret=JBSWY3DPEHPK3PXP&issuer=Flyerx',
    backupCodes: [
      'ABCD-1234',
      'EFGH-5678',
      'IJKL-9012',
      'MNOP-3456',
      'QRST-7890',
      'UVWX-1234',
      'YZAB-5678',
      'CDEF-9012',
    ],
  };
};

// ===== Mock Tokens =====
export const generateMockTokens = () => ({
  accessToken: `mock-access-${Date.now()}`,
  refreshToken: `mock-refresh-${Date.now()}`,
  expiresIn: 3600,
});

// ===== Pix2Depix Mock Data =====

// Armazenamento temporário de depósitos e saques mock
export const mockPix2DepixDeposits: Map<string, {
  status: Pix2DepixDepositStatus;
  valueInCents: number;
  expiration: string;
  createdAt: number;
}> = new Map();

export const mockPix2DepixWithdrawals: Map<string, {
  status: Pix2DepixWithdrawStatus;
  depositAmountInCents: number;
  payoutAmountInCents: number;
  createdAt: number;
}> = new Map();

export const generateMockPix2DepixDeposit = (
  amountInCents: number,
  endUserTaxNumber: string
): Pix2DepixDepositResponse => {
  const id = `pix2depix-dep-${Date.now()}`;
  const qrCopyPaste = `00020126580014br.gov.bcb.pix0136${id}520400005303986540${(amountInCents / 100).toFixed(2)}5802BR5913EULEN_DEPIX6008SAOPAULO62070503***6304`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCopyPaste)}`;

  // Salva no storage temporário para simular polling
  mockPix2DepixDeposits.set(id, {
    status: 'pending',
    valueInCents: amountInCents,
    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: Date.now(),
  });

  return {
    id,
    qrCopyPaste,
    qrImageUrl,
  };
};

export const getMockPix2DepixDepositStatus = (id: string): Pix2DepixDepositStatusResponse => {
  const deposit = mockPix2DepixDeposits.get(id);

  if (!deposit) {
    return {
      id,
      status: 'expired',
      valueInCents: 0,
      expiration: new Date().toISOString(),
    };
  }

  // Simula progressão do status após alguns segundos
  const elapsed = Date.now() - deposit.createdAt;
  let status = deposit.status;

  if (elapsed > 15000 && status === 'pending') {
    status = 'under_review';
    deposit.status = status;
  }
  if (elapsed > 25000 && status === 'under_review') {
    status = 'approved';
    deposit.status = status;
  }
  if (elapsed > 30000 && status === 'approved') {
    status = 'depix_sent';
    deposit.status = status;
  }

  return {
    id,
    status,
    valueInCents: deposit.valueInCents,
    expiration: deposit.expiration,
    blockchainTxID: status === 'depix_sent' ? `tx-${id}-liquid` : undefined,
  };
};

export const generateMockPix2DepixWithdraw = (
  pixKey: string,
  taxNumber: string,
  euid: string,
  amountInCents: number,
  isPayoutAmount: boolean
): Pix2DepixWithdrawResponse => {
  const withdrawalId = `pix2depix-wth-${Date.now()}`;
  const depositAddress = `lq1qqw5h7r5c7qfnmjvp4xqrqzqfqg4r6jkchp3tnc6zq${Date.now().toString(36)}`;

  // Calcula valores (simulando uma taxa de ~1%)
  const fee = Math.round(amountInCents * 0.01);
  const depositAmountInCents = isPayoutAmount ? amountInCents + fee : amountInCents;
  const payoutAmountInCents = isPayoutAmount ? amountInCents : amountInCents - fee;

  // Salva no storage temporário
  mockPix2DepixWithdrawals.set(withdrawalId, {
    status: 'unsent',
    depositAmountInCents,
    payoutAmountInCents,
    createdAt: Date.now(),
  });

  return {
    withdrawalId,
    depositAddress,
    depositAmountInCents,
    payoutAmountInCents,
  };
};

export const getMockPix2DepixWithdrawStatus = (id: string): Pix2DepixWithdrawStatusResponse => {
  const withdrawal = mockPix2DepixWithdrawals.get(id);

  if (!withdrawal) {
    return {
      id,
      status: 'error',
      depositAmountInCents: 0,
      payoutAmountInCents: 0,
    };
  }

  // Simula progressão do status após alguns segundos
  const elapsed = Date.now() - withdrawal.createdAt;
  let status = withdrawal.status;

  if (elapsed > 10000 && status === 'unsent') {
    status = 'sending';
    withdrawal.status = status;
  }
  if (elapsed > 20000 && status === 'sending') {
    status = 'sent';
    withdrawal.status = status;
  }

  return {
    id,
    status,
    depositAmountInCents: withdrawal.depositAmountInCents,
    payoutAmountInCents: withdrawal.payoutAmountInCents,
    blockchainTxID: status !== 'unsent' ? `tx-${id}-liquid` : undefined,
    receiptUrl: status === 'sent' ? `https://pix.bcb.gov.br/receipt/${id}` : undefined,
  };
};

export const getMockPix2DepixUserInfo = (euid: string): Pix2DepixUserInfo => {
  // Mock de limites diários
  return {
    dailyVolumeInCents: 250000, // R$ 2.500,00 já usado
    maxDailyInCents: 1000000,   // R$ 10.000,00 limite
    isBlocked: false,
    dailyLimitResetTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // Reset em 12h
  };
};
