// ===== Configuração de Taxas Flyerx =====

/**
 * Configuração de taxas para depósito (PIX → DePix)
 */
export interface DepositFeeConfig {
  // Taxa fixa da Eulen (não configurável)
  eulenFixedFee: number; // R$ 0,99

  // Taxa do parceiro Flyerx
  partnerPercentFee: number; // Ex: 0.02 = 2%
  partnerFixedFee: number; // Ex: 0.50 = R$ 0,50

  // Endereço para receber split
  partnerDepixAddress: string;
}

/**
 * Configuração de taxas para saque (DePix → PIX)
 */
export interface WithdrawFeeConfig {
  // Taxa da Eulen (não configurável)
  eulenPercentFee: number; // 1%
  eulenMinFee: number; // R$ 1,00

  // Taxa do parceiro Flyerx
  partnerPercentFee: number; // Ex: 0.005 = 0,5%
  partnerFixedFee: number; // Ex: 0.50 = R$ 0,50
  partnerMinFee: number; // Ex: 0.50 = mínimo R$ 0,50

  // Endereço para receber DePix do usuário (antes de enviar para Eulen)
  partnerDepixAddress: string;
}

/**
 * Configuração completa de taxas
 */
export interface FeeConfig {
  deposit: DepositFeeConfig;
  withdraw: WithdrawFeeConfig;
  updatedAt: string;
}

/**
 * Limites de transação
 */
export interface TransactionLimits {
  deposit: {
    min: number;
    max: number;
    firstDepositMax: number; // Limite do primeiro depósito por CPF
    dailyMax: number;
  };
  withdraw: {
    min: number;
    max: number;
    dailyMax: number;
  };
}

/**
 * Carteira Liquid salva
 */
export interface SavedWallet {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
  createdAt: string;
}

// ===== Funções de cálculo de taxas =====

/**
 * Calcula a taxa total de depósito
 * @param amount Valor em reais que o cliente quer receber
 * @param config Configuração de taxas
 * @param passToCustomer Se true, o cliente paga as taxas (valor do PIX será maior)
 *
 * IMPORTANTE: O split da API Eulen é calculado sobre o valor do PIX, não sobre o valor base.
 * Por isso, quando passToCustomer=true, usamos a fórmula:
 *   valorPix = (valorDesejado + taxaEulen + taxaFixaParceiro) / (1 - taxaPercentualParceiro)
 */
export const calculateDepositFee = (
  amount: number,
  config: DepositFeeConfig,
  passToCustomer: boolean = false
): {
  eulenFee: number;
  partnerFee: number;
  totalFee: number;
  amountToCharge: number; // Valor a cobrar do cliente (PIX)
  amountToReceive: number; // Valor que o cliente recebe em DePix
} => {
  const eulenFee = config.eulenFixedFee;

  if (passToCustomer) {
    // Cliente paga as taxas - calcular valor do PIX para que sobre exatamente 'amount'
    // Fórmula: valorPix = (amount + eulenFee + partnerFixedFee) / (1 - partnerPercentFee)
    const amountToCharge = (amount + eulenFee + config.partnerFixedFee) / (1 - config.partnerPercentFee);

    // Taxa do parceiro é calculada sobre o valor do PIX
    const partnerFee = amountToCharge * config.partnerPercentFee + config.partnerFixedFee;
    const totalFee = eulenFee + partnerFee;

    return {
      eulenFee,
      partnerFee: Math.round(partnerFee * 100) / 100, // Arredondar para 2 casas
      totalFee: Math.round(totalFee * 100) / 100,
      amountToCharge: Math.round(amountToCharge * 100) / 100,
      amountToReceive: amount,
    };
  }

  // Usuário absorve as taxas - taxa calculada sobre o valor informado
  const partnerFee = amount * config.partnerPercentFee + config.partnerFixedFee;
  const totalFee = eulenFee + partnerFee;

  return {
    eulenFee,
    partnerFee,
    totalFee,
    amountToCharge: amount,
    amountToReceive: Math.max(0, amount - totalFee),
  };
};

/**
 * Calcula a taxa total de saque
 * @param amount Valor em reais que o usuário quer receber
 * @param config Configuração de taxas
 */
export const calculateWithdrawFee = (
  amount: number,
  config: WithdrawFeeConfig
): {
  eulenFee: number;
  partnerFee: number;
  totalFee: number;
  depixToSend: number; // DePix que o usuário precisa enviar
  pixToReceive: number; // PIX que o usuário vai receber
} => {
  // Taxa Eulen: 1% com mínimo de R$1
  const eulenFee = Math.max(amount * config.eulenPercentFee, config.eulenMinFee);

  // Taxa parceiro
  const partnerFeeCalculated = amount * config.partnerPercentFee + config.partnerFixedFee;
  const partnerFee = Math.max(partnerFeeCalculated, config.partnerMinFee);

  const totalFee = eulenFee + partnerFee;

  return {
    eulenFee,
    partnerFee,
    totalFee,
    depixToSend: amount + totalFee,
    pixToReceive: amount,
  };
};

/**
 * Formata taxa para exibição
 * Ex: "2% + R$ 0,99"
 */
export const formatFeeDisplay = (percentFee: number, fixedFee: number): string => {
  const parts: string[] = [];

  if (percentFee > 0) {
    parts.push(`${(percentFee * 100).toFixed(0)}%`);
  }

  if (fixedFee > 0) {
    parts.push(`R$ ${fixedFee.toFixed(2).replace('.', ',')}`);
  }

  return parts.join(' + ') || 'Grátis';
};

// ===== Valores padrão =====

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  deposit: {
    eulenFixedFee: 0.99,
    partnerPercentFee: 0.02, // 2%
    partnerFixedFee: 0,
    partnerDepixAddress: '', // Configurar no admin
  },
  withdraw: {
    eulenPercentFee: 0.01, // 1%
    eulenMinFee: 1.0,
    partnerPercentFee: 0.005, // 0.5%
    partnerFixedFee: 0,
    partnerMinFee: 0.5,
    partnerDepixAddress: '', // Configurar no admin
  },
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_LIMITS: TransactionLimits = {
  deposit: {
    min: 2, // Mínimo R$ 2,00
    max: 6000, // Máximo R$ 6.000,00 por QR (limite Eulen)
    firstDepositMax: 500, // Primeiro depósito: R$ 500,00 (CPF não identificado)
    dailyMax: 6000, // Limite diário R$ 6.000,00 por CPF/CNPJ (reset à meia-noite)
  },
  withdraw: {
    min: 10, // Mínimo R$ 10,00 (Eulen permite R$ 2, mas definimos R$ 10 para o Flyerx)
    max: 6000, // Máximo R$ 6.000,00 por saque
    dailyMax: 100000, // Sem limite prático - o limite é do beneficiário (CPF/CNPJ informado), não do usuário
  },
};
