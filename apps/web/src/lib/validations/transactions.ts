import { z } from 'zod';

// Limites de transação
export const DEPOSIT_LIMITS = {
  min: 10,
  max: 50000,
};

export const WITHDRAWAL_LIMITS = {
  min: 2,      // Mínimo R$2,00
  max: 6000,   // Máximo R$6.000,00 por saque
};

// Taxa de saque: 1% com mínimo de R$1,00
export const calculateWithdrawalFee = (amount: number): number => {
  const fee = amount * 0.01;
  return Math.max(fee, 1.0); // Mínimo R$1,00
};

// Validadores de chave PIX
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?55?\d{10,11}$/;
const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// Schema de Depósito
export const depositSchema = z.object({
  amount: z
    .number({
      error: 'Valor é obrigatório',
    })
    .min(DEPOSIT_LIMITS.min, `Valor mínimo é R$ ${DEPOSIT_LIMITS.min}`)
    .max(DEPOSIT_LIMITS.max, `Valor máximo é R$ ${DEPOSIT_LIMITS.max.toLocaleString('pt-BR')}`),
});

export type DepositFormData = z.infer<typeof depositSchema>;

// Schema de Saque
export const withdrawalSchema = z
  .object({
    amount: z
      .number({
        error: 'Valor é obrigatório',
      })
      .min(WITHDRAWAL_LIMITS.min, `Valor mínimo é R$ ${WITHDRAWAL_LIMITS.min}`)
      .max(
        WITHDRAWAL_LIMITS.max,
        `Valor máximo é R$ ${WITHDRAWAL_LIMITS.max.toLocaleString('pt-BR')}`
      ),
    pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'], {
      message: 'Tipo de chave PIX é obrigatório',
    }),
    pixKey: z.string().min(1, 'Chave PIX é obrigatória'),
    twoFactorCode: z.string().optional(),
  })
  .refine(
    (data) => {
      const { pixKeyType, pixKey } = data;
      switch (pixKeyType) {
        case 'cpf':
          return cpfRegex.test(pixKey);
        case 'cnpj':
          return cnpjRegex.test(pixKey);
        case 'email':
          return emailRegex.test(pixKey);
        case 'phone':
          return phoneRegex.test(pixKey.replace(/\D/g, ''));
        case 'random':
          return randomKeyRegex.test(pixKey);
        default:
          return false;
      }
    },
    {
      message: 'Chave PIX inválida para o tipo selecionado',
      path: ['pixKey'],
    }
  );

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

// Schema para estimar taxa
export const estimateFeeSchema = z.object({
  amount: z
    .number({
      error: 'Valor é obrigatório',
    })
    .positive('Valor deve ser positivo'),
});

export type EstimateFeeFormData = z.infer<typeof estimateFeeSchema>;

// Schema de filtros de transação
export const transactionFiltersSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']).optional(),
  status: z
    .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
});

export type TransactionFiltersFormData = z.infer<typeof transactionFiltersSchema>;

// Helpers para formatar valores
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrencyInput = (value: string): number => {
  // Remove tudo exceto números e vírgula/ponto
  const cleaned = value.replace(/[^\d,.-]/g, '');
  // Substitui vírgula por ponto
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Labels para tipos de chave PIX (chaves em minúsculas para compatibilidade com enum Laravel)
export const PIX_KEY_TYPE_LABELS: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave aleatória',
};

// Placeholders para chaves PIX (chaves em minúsculas)
export const PIX_KEY_PLACEHOLDERS: Record<string, string> = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  email: 'email@exemplo.com',
  phone: '+5511999999999',
  random: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

// ===== Pix2Depix Validations =====

// Validação de CPF (algoritmo completo)
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

// Validação de CNPJ (algoritmo completo)
export const isValidCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(13))) return false;

  return true;
};

// Validação de endereço Liquid (DePix)
export const isValidLiquidAddress = (address: string): boolean => {
  if (!address) return false;
  const liquidAddressRegex = /^(lq1|ex1)[a-z0-9]{40,}$/i;
  return liquidAddressRegex.test(address);
};

// Validação de EUID (Eulen User ID)
export const isValidEUID = (euid: string): boolean => {
  if (!euid) return false;
  const euidRegex = /^EU\d{15}$/;
  return euidRegex.test(euid);
};

// Schema para endereço Liquid
export const liquidAddressSchema = z
  .string()
  .min(1, 'Endereço Liquid é obrigatório')
  .refine(isValidLiquidAddress, 'Endereço Liquid inválido (deve começar com lq1 ou ex1)');

// Schema para EUID
export const euidSchema = z
  .string()
  .optional()
  .refine((val) => !val || isValidEUID(val), 'EUID inválido (formato: EU + 15 dígitos)');

// Schema para CPF/CNPJ do titular da chave PIX (saque)
export const recipientTaxNumberSchema = z
  .string()
  .min(1, 'CPF/CNPJ do titular é obrigatório')
  .refine(
    (val) => {
      const cleaned = val.replace(/\D/g, '');
      return isValidCPF(cleaned) || isValidCNPJ(cleaned);
    },
    'CPF ou CNPJ inválido'
  );

// Schema de Saque atualizado para Pix2Depix
export const pix2DepixWithdrawalSchema = z
  .object({
    amount: z
      .number({
        error: 'Valor é obrigatório',
      })
      .min(WITHDRAWAL_LIMITS.min, `Valor mínimo é R$ ${WITHDRAWAL_LIMITS.min}`)
      .max(
        WITHDRAWAL_LIMITS.max,
        `Valor máximo é R$ ${WITHDRAWAL_LIMITS.max.toLocaleString('pt-BR')}`
      ),
    pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'], {
      message: 'Tipo de chave PIX é obrigatório',
    }),
    pixKey: z.string().min(1, 'Chave PIX é obrigatória'),
    recipientTaxNumber: z
      .string()
      .min(1, 'CPF/CNPJ do titular é obrigatório'),
  })
  .refine(
    (data) => {
      const { pixKeyType, pixKey } = data;
      switch (pixKeyType) {
        case 'cpf':
          return cpfRegex.test(pixKey);
        case 'cnpj':
          return cnpjRegex.test(pixKey);
        case 'email':
          return emailRegex.test(pixKey);
        case 'phone':
          return phoneRegex.test(pixKey.replace(/\D/g, ''));
        case 'random':
          return randomKeyRegex.test(pixKey);
        default:
          return false;
      }
    },
    {
      message: 'Chave PIX inválida para o tipo selecionado',
      path: ['pixKey'],
    }
  )
  .refine(
    (data) => {
      const cleaned = data.recipientTaxNumber.replace(/\D/g, '');
      return isValidCPF(cleaned) || isValidCNPJ(cleaned);
    },
    {
      message: 'CPF ou CNPJ do titular inválido',
      path: ['recipientTaxNumber'],
    }
  );

export type Pix2DepixWithdrawalFormData = z.infer<typeof pix2DepixWithdrawalSchema>;

// Schema para configuração de carteira Liquid
export const liquidWalletSchema = z.object({
  depixAddress: z
    .string()
    .min(1, 'Endereço Liquid é obrigatório')
    .refine(
      isValidLiquidAddress,
      'Endereço Liquid inválido (deve começar com lq1 ou ex1)'
    ),
});

export type LiquidWalletFormData = z.infer<typeof liquidWalletSchema>;
