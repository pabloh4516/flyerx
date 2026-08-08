import axios from 'axios';
import type {
  Pix2DepixDepositRequest,
  Pix2DepixDepositResponse,
  Pix2DepixDepositStatusResponse,
  Pix2DepixWithdrawRequest,
  Pix2DepixWithdrawResponse,
  Pix2DepixWithdrawStatusResponse,
  Pix2DepixUserInfo,
} from '@/types/pix2depix';

// ===== Pix2Depix API Client =====
// Integração com API Pix2Depix da Eulen para conversão BRL ↔ DePix (Liquid Network)
// Usa API routes internas do Next.js para evitar CORS

// Cliente para API routes internas (proxy para Pix2Depix)
const client = axios.create({
  baseURL: '/api/pix2depix',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ===== Depósito (PIX → DePix) =====

export interface CreateDepositParams {
  amountReais: number;
  endUserTaxNumber: string;
  depixAddress?: string;
  euid?: string;
  // Split para parceiros
  depixSplitAddress?: string;
  splitFee?: string;
}

/**
 * Cria um novo depósito via PIX para conversão em DePix
 * Suporta split para parceiros receberem comissão automaticamente
 */
export const createPix2DepixDeposit = async (
  params: CreateDepositParams
): Promise<Pix2DepixDepositResponse> => {
  const {
    amountReais,
    endUserTaxNumber,
    depixAddress,
    euid,
    depixSplitAddress,
    splitFee,
  } = params;

  const request: Pix2DepixDepositRequest = {
    amountInCents: Math.round(amountReais * 100),
    endUserTaxNumber: endUserTaxNumber.replace(/\D/g, ''), // Remove formatação
    ...(depixAddress && { depixAddress }),
    ...(euid && { euid }),
    // Parâmetros de split para comissão do parceiro
    ...(depixSplitAddress && { depixSplitAddress }),
    ...(splitFee && { splitFee }),
  };

  const response = await client.post<Pix2DepixDepositResponse | { error: string }>('/deposit', request);

  // Verificar se houve erro
  if ('error' in response.data) {
    throw new Error(response.data.error);
  }

  return response.data;
};

/**
 * Consulta o status de um depósito
 * @param id - ID do depósito retornado na criação
 */
export const getPix2DepixDepositStatus = async (
  id: string
): Promise<Pix2DepixDepositStatusResponse> => {
  const response = await client.get<Pix2DepixDepositStatusResponse | { error: string }>(`/deposit-status?id=${id}`);

  // Verificar se houve erro
  if ('error' in response.data) {
    throw new Error(response.data.error);
  }

  return response.data;
};

// ===== Saque (DePix → PIX) =====

/**
 * Cria uma solicitação de saque (DePix → PIX)
 * Retorna um endereço Liquid para o usuário enviar DePix
 * @param pixKey - Chave PIX do destinatário
 * @param taxNumber - CPF/CNPJ do DONO da chave PIX (pode ser terceiro)
 * @param euid - Eulen User ID
 * @param amountReais - Valor em reais (usar depositAmount OU payoutAmount)
 * @param isPayoutAmount - Se true, usa payoutAmountInCents; se false, usa depositAmountInCents
 */
export const createPix2DepixWithdraw = async (
  pixKey: string,
  taxNumber: string,
  euid: string,
  amountReais: number,
  isPayoutAmount = true
): Promise<Pix2DepixWithdrawResponse> => {
  const amountInCents = Math.round(amountReais * 100);
  const cleanTaxNumber = taxNumber.replace(/\D/g, '');

  // IMPORTANTE: A API só aceita taxNumber OU euid, não ambos.
  // Priorizamos taxNumber quando informado (CPF/CNPJ do titular da chave PIX)
  const request: Pix2DepixWithdrawRequest = {
    pixKey,
    ...(cleanTaxNumber ? { taxNumber: cleanTaxNumber } : { euid }),
    ...(isPayoutAmount
      ? { payoutAmountInCents: amountInCents }
      : { depositAmountInCents: amountInCents }),
  };

  const response = await client.post<Pix2DepixWithdrawResponse>('/withdraw', request);
  return response.data;
};

/**
 * Consulta o status de um saque
 * @param id - ID do saque (withdrawalId)
 */
export const getPix2DepixWithdrawStatus = async (
  id: string
): Promise<Pix2DepixWithdrawStatusResponse> => {
  const response = await client.get<Pix2DepixWithdrawStatusResponse>(`/withdraw-status?id=${id}`);
  return response.data;
};

// ===== Informações do Usuário =====

/**
 * Obtém informações do usuário, incluindo limites diários
 * @param euid - Eulen User ID
 */
export const getPix2DepixUserInfo = async (
  euid: string
): Promise<Pix2DepixUserInfo> => {
  const response = await client.get<Pix2DepixUserInfo>(`/user-info?euid=${euid}`);
  return response.data;
};

// ===== Helpers de Validação =====

/**
 * Valida se um endereço Liquid é válido
 * Aceita prefixos lq1... ou ex1...
 */
export const isValidLiquidAddress = (address: string): boolean => {
  if (!address) return false;
  const liquidAddressRegex = /^(lq1|ex1)[a-z0-9]{40,}$/i;
  return liquidAddressRegex.test(address);
};

/**
 * Valida se um EUID (Eulen User ID) é válido
 * Formato: EU + 15 dígitos
 */
export const isValidEUID = (euid: string): boolean => {
  if (!euid) return false;
  const euidRegex = /^EU\d{15}$/;
  return euidRegex.test(euid);
};

/**
 * Calcula se o usuário está dentro do limite diário
 */
export const checkDailyLimit = (
  userInfo: Pix2DepixUserInfo,
  amountInCents: number
): { allowed: boolean; remainingInCents: number } => {
  const remaining = userInfo.maxDailyInCents - userInfo.dailyVolumeInCents;
  return {
    allowed: amountInCents <= remaining && !userInfo.isBlocked,
    remainingInCents: Math.max(0, remaining),
  };
};
