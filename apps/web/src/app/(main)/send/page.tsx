'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  Send,
  Check,
  User,
  Building2,
  Mail,
  Phone,
  Key,
  Copy,
  Home,
  ExternalLink,
  Loader2,
  Clock,
  RefreshCw,
  CreditCard,
  QrCode,
  Zap,
} from 'lucide-react';

import { Button, Input, Container } from '@/components/ui';
import { StepsGuide } from '@/components/ui/steps-guide';
import { Logo } from '@/components/ui/nocturne';

import {
  useCreateBackendWithdraw,
  useBackendWithdrawStatus,
  useCreateDirectEulenWithdraw,
  useDirectEulenWithdrawStatus,
  useInvalidateWalletData,
  useDailyLimit,
} from '@/hooks/use-queries';
import { useAuthStore } from '@/stores/auth';
import { useFeesStore } from '@/stores/fees';
import { formatCurrency } from '@/lib/validations/transactions';
import { cn } from '@/lib/utils';
import type { PixKeyType } from '@/types';

const formSchema = z.object({
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']),
  pixKey: z.string().min(1, 'Informe a chave PIX'),
  recipientTaxNumber: z.string().optional(), // CPF/CNPJ do titular (obrigatório quando chave não é CPF/CNPJ)
  amount: z
    .number({ message: 'Informe um valor' })
    .min(10, 'Mínimo R$ 10,00') // TODO: Configurável via painel admin
    .max(50000, 'Máximo R$ 50.000,00'),
});

type FormData = z.infer<typeof formSchema>;

interface WithdrawState {
  id: string;
  flyerxAddress: string;
  payoutAmountCents: number;
  depositAmountCents: number;
  status: string; // pending, depix_received, processing, sent_to_eulen, completed, failed
}

const pixKeyTypes: { type: PixKeyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'CPF', label: 'CPF', icon: User },
  { type: 'CNPJ', label: 'CNPJ', icon: Building2 },
  { type: 'EMAIL', label: 'Email', icon: Mail },
  { type: 'PHONE', label: 'Tel', icon: Phone },
  { type: 'RANDOM', label: 'Aleatória', icon: Key },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

// Normaliza a chave PIX para o formato esperado pela API
const normalizePixKey = (pixKey: string, keyType: PixKeyType): string => {
  if (keyType === 'PHONE') {
    // Remove tudo que não é dígito
    const digits = pixKey.replace(/\D/g, '');
    // Se não começar com 55, adiciona +55
    if (digits.startsWith('55')) {
      return `+${digits}`;
    }
    return `+55${digits}`;
  }
  if (keyType === 'CPF' || keyType === 'CNPJ') {
    // Remove formatação
    return pixKey.replace(/\D/g, '');
  }
  return pixKey;
};

// Normaliza e extrai CPF/CNPJ da chave PIX
const extractTaxNumber = (pixKey: string, keyType: PixKeyType): string | null => {
  if (keyType === 'CPF' || keyType === 'CNPJ') {
    // Remove formatação e retorna apenas dígitos
    return pixKey.replace(/\D/g, '');
  }
  return null;
};

// Valida CPF/CNPJ básico
const isValidTaxNumber = (value: string): boolean => {
  const clean = value.replace(/\D/g, '');
  return clean.length === 11 || clean.length === 14;
};

const steps = [
  { id: 1, label: 'Valor', icon: CreditCard },
  { id: 2, label: 'Pagar DePix', icon: QrCode },
  { id: 3, label: 'Confirmado', icon: Check },
];

export default function SellerSendPage() {
  const user = useAuthStore((state) => state.user);
  const { limits, feeConfig } = useFeesStore();

  // Detectar se é usuário direto (sem taxa de parceiro)
  const isDirectUser = user?.useDirectEulen ?? false;

  const [step, setStep] = useState(1);
  const [withdraw, setWithdraw] = useState<WithdrawState | null>(null);
  const [copied, setCopied] = useState(false);

  const invalidateWalletData = useInvalidateWalletData();

  // Hooks para saque normal (via backend Python)
  const createBackendWithdraw = useCreateBackendWithdraw();
  const { data: backendStatus } = useBackendWithdrawStatus(
    !isDirectUser ? (withdraw?.id ?? '') : '',
    user?.id ?? '',
    !!withdraw && !isDirectUser
  );

  // Hooks para saque direto (via Eulen)
  const createDirectWithdraw = useCreateDirectEulenWithdraw();
  const { data: directStatus } = useDirectEulenWithdrawStatus(
    isDirectUser ? (withdraw?.id ?? '') : '',
    !!withdraw && isDirectUser
  );

  // Combinar status baseado no tipo de usuário
  const withdrawStatus = isDirectUser ? directStatus : backendStatus;

  const { data: dailyLimit } = useDailyLimit(user?.document ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pixKeyType: 'CPF',
      pixKey: '',
      recipientTaxNumber: '',
    },
  });

  const amount = watch('amount') || 0;
  const pixKeyType = watch('pixKeyType');
  const pixKey = watch('pixKey');
  const recipientTaxNumber = watch('recipientTaxNumber');

  // Se a chave é CPF/CNPJ, não precisa do campo extra
  const needsTaxNumber = pixKeyType !== 'CPF' && pixKeyType !== 'CNPJ';

  // Cálculo de taxa
  // Usuário direto: só taxa da Eulen (sem taxa de parceiro)
  // Usuário normal: taxa da Eulen + taxa do parceiro
  const eulenFee = Math.max(
    feeConfig.withdraw.eulenMinFee,
    amount * feeConfig.withdraw.eulenPercentFee
  );
  // Sem fallbacks - usa exatamente o que está na config (que é 0 para parceiro)
  const partnerMinFee = feeConfig.withdraw.partnerMinFee ?? 0;
  const partnerPercentFee = feeConfig.withdraw.partnerPercentFee ?? 0;
  const partnerFee = isDirectUser ? 0 : Math.max(
    partnerMinFee,
    amount * partnerPercentFee
  );
  const fee = eulenFee + partnerFee;
  const totalToSend = amount + fee;

  // Update status from polling
  if (withdrawStatus && withdraw) {
    if (withdraw.status !== withdrawStatus.status) {
      setWithdraw({
        ...withdraw,
        status: withdrawStatus.status,
      });

      // Para usuário direto, "sent" = completed
      // Para usuário normal (backend), "completed" = completed
      const isCompleted = isDirectUser
        ? withdrawStatus.status === 'sent'
        : withdrawStatus.status === 'completed';

      if (isCompleted) {
        setStep(3);
        toast.success('PIX enviado com sucesso!');
        invalidateWalletData();
      }
    }
  }

  const handleCopy = async () => {
    if (!withdraw?.flyerxAddress) return;
    try {
      await navigator.clipboard.writeText(withdraw.flyerxAddress);
      setCopied(true);
      toast.success('Endereço copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const onSubmit = async (data: FormData) => {
    // Determina o taxNumber do TITULAR da chave PIX (não do usuário)
    let taxNumber: string;

    if (data.pixKeyType === 'CPF' || data.pixKeyType === 'CNPJ') {
      // Se a chave É CPF/CNPJ, extraímos o número dela mesma
      taxNumber = data.pixKey.replace(/\D/g, '');
    } else {
      // Se é outro tipo, usamos o campo que o usuário preencheu
      if (!data.recipientTaxNumber || !isValidTaxNumber(data.recipientTaxNumber)) {
        toast.error('Informe o CPF/CNPJ do titular da chave PIX');
        return;
      }
      taxNumber = data.recipientTaxNumber.replace(/\D/g, '');
    }

    // Normaliza a chave PIX (adiciona +55 em telefones, remove formatação de CPF/CNPJ)
    const normalizedPixKey = normalizePixKey(data.pixKey, data.pixKeyType);

    try {
      if (isDirectUser) {
        // Usuário direto: chama Eulen diretamente (sem taxa de parceiro, mais rápido)
        // Eulen aceita OU taxNumber OU euid, não ambos
        const result = await createDirectWithdraw.mutateAsync({
          pixKey: normalizedPixKey,
          ...(user?.euid
            ? { euid: user.euid }
            : { taxNumber: taxNumber }
          ),
          payoutAmountInCents: Math.round(data.amount * 100),
        });

        setWithdraw({
          id: result.withdrawalId,
          flyerxAddress: result.depositAddress,
          payoutAmountCents: result.payoutAmountInCents,
          depositAmountCents: result.depositAmountInCents,
          status: 'unsent', // Status inicial da Eulen
        });
      } else {
        // Usuário normal: chama backend Python (com taxa de parceiro)
        const result = await createBackendWithdraw.mutateAsync({
          user_id: user?.id || 'anonymous',
          pix_key: normalizedPixKey,
          pix_key_type: data.pixKeyType,
          beneficiary_tax_number: taxNumber,
          amount_cents: Math.round(data.amount * 100),
        });

        setWithdraw({
          id: result.id,
          flyerxAddress: result.flyerx_address,
          payoutAmountCents: Math.round(result.breakdown.requested_amount * 100),
          depositAmountCents: Math.round(result.breakdown.total_depix * 100),
          status: result.status,
        });
      }

      setStep(2);
      toast.success('Saque criado! Envie o DePix para o endereço abaixo.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar saque';
      toast.error(message);
    }
  };

  const handleNewWithdraw = () => {
    setWithdraw(null);
    setStep(1);
    setValue('amount', 0);
    setValue('pixKey', '');
  };

  const feeDisplay = `${(feeConfig.withdraw.eulenPercentFee * 100).toFixed(0)}% (mín R$ ${feeConfig.withdraw.eulenMinFee.toFixed(2).replace('.', ',')})`;

  return (
    <Container size="lg" padded={false} className="p-7 flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-full bg-accent-900/30 border border-accent-700/50 flex items-center justify-center">
            <Send className="size-5 text-accent-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Enviar PIX</h1>
            <p className="text-xs text-neutral-500">Envie para qualquer chave • Taxa {feeDisplay}</p>
          </div>
        </div>

        {/* Daily Limit Bar - sempre visível */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Limite diário</span>
            <span className="text-neutral-300 font-medium tabular-nums">
              R$ {(dailyLimit?.daily_volume_reais ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })} / {(dailyLimit?.daily_limit_reais ?? 5000).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="w-32 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                dailyLimit && dailyLimit.remaining_reais <= 0 ? "bg-destructive" : "bg-accent-500"
              )}
              style={{ width: `${dailyLimit ? Math.min((dailyLimit.daily_volume_reais / dailyLimit.daily_limit_reais) * 100, 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <span
              className={cn(
                'inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full whitespace-nowrap text-sm border transition-colors',
                step === s.id
                  ? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent-200 font-medium'
                  : step > s.id
                  ? 'border-accent-700 text-accent-300'
                  : 'border-border text-neutral-500'
              )}
            >
              {step > s.id ? (
                <Check className="size-4" />
              ) : (
                <s.icon className="size-4" />
              )}
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'w-16 h-px',
                  step > s.id
                    ? 'bg-accent-700'
                    : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Amount */}
      {step === 1 && (
        <div className="grid grid-cols-[1fr_0.85fr] gap-11 items-start">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* HERO: Amount display */}
            <div className="flex flex-col items-center gap-3 py-4">
              <span className="text-sm text-neutral-500">Destinatário recebe</span>
              <div className="flex items-baseline gap-1">
                <span className="text-neutral-500 text-2xl">R$</span>
                <span className={cn(
                  "text-5xl font-bold tabular-nums",
                  amount > 0 ? "text-accent-200" : "text-neutral-700"
                )}>
                  {amount > 0
                    ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0,00'
                  }
                </span>
              </div>
              {amount > 0 && (
                <p className="text-sm text-neutral-600">
                  Você paga {formatCurrency(totalToSend)} (taxa {formatCurrency(fee)})
                </p>
              )}
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-500 uppercase tracking-wide">Valor do envio</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border focus-within:border-primary transition-colors">
                <span className="text-neutral-500 text-lg">R$</span>
                <input
                  type="number"
                  step={0.01}
                  min={limits.withdraw.min}
                  max={limits.withdraw.max}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Quick amounts - pills */}
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('amount', value, { shouldValidate: true })}
                  className={cn(
                    'px-4 py-1.5 text-sm rounded-full transition-all',
                    amount === value
                      ? 'bg-accent-800 text-accent-200 font-medium'
                      : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>

            {/* PIX Key Type - pills */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-neutral-500 uppercase tracking-wide">Tipo de chave</span>
              <div className="flex gap-2 flex-wrap">
                {pixKeyTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('pixKeyType', type)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                      pixKeyType === type
                        ? 'border-accent bg-accent-900/30 text-accent-200'
                        : 'border-border text-neutral-400 hover:border-neutral-600'
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PIX Key input */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-neutral-500 uppercase tracking-wide">Chave PIX</span>
              <Input
                type="text"
                placeholder={
                  pixKeyType === 'CPF' ? '000.000.000-00' :
                  pixKeyType === 'CNPJ' ? '00.000.000/0000-00' :
                  pixKeyType === 'EMAIL' ? 'email@exemplo.com' :
                  pixKeyType === 'PHONE' ? '(00) 00000-0000' :
                  'Chave aleatória'
                }
                className="text-center text-lg"
                {...register('pixKey')}
              />
              {errors.pixKey && (
                <p className="text-xs text-destructive">{errors.pixKey.message}</p>
              )}
            </div>

            {/* CPF/CNPJ do titular - só aparece quando a chave NÃO é CPF/CNPJ */}
            {needsTaxNumber && (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-neutral-500 uppercase tracking-wide">CPF/CNPJ do titular da chave</span>
                <Input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="text-center text-lg"
                  {...register('recipientTaxNumber')}
                />
                <p className="text-xs text-neutral-600">
                  Informe o CPF ou CNPJ de quem vai receber o PIX
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="solid"
              size="lg"
              fullWidth
              disabled={
                createBackendWithdraw.isPending ||
                createDirectWithdraw.isPending ||
                !amount ||
                !pixKey ||
                (needsTaxNumber && (!recipientTaxNumber || !isValidTaxNumber(recipientTaxNumber)))
              }
            >
              {(createBackendWithdraw.isPending || createDirectWithdraw.isPending) && <Loader2 className="size-4 animate-spin" />}
              <Send className="size-4" />
              Enviar PIX
            </Button>
          </form>

          {/* How it works - aligned lower */}
          <div className="pt-14">
            <StepsGuide
              headerIcon={Zap}
              title="Como funciona"
              subtitle="Passo a passo simples"
              steps={[
                { icon: CreditCard, title: 'Digite o valor', description: 'Informe o valor e a chave PIX do destinatário' },
                { icon: QrCode, title: 'Pague em DePix', description: 'Envie DePix para o endereço gerado' },
                { icon: Check, title: 'PIX enviado', description: 'O destinatário recebe o PIX na hora' },
              ]}
            />
          </div>
        </div>
      )}

      {/* Step 2: Pay */}
      {step === 2 && withdraw && (
        <div className="flex flex-col items-center gap-6">
          {/* Status */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-full border border-amber-700/50 bg-amber-900/20">
            <Clock className="size-4 text-amber-400" />
            <span className="text-sm text-amber-300">Aguardando pagamento</span>
          </div>

          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-neutral-500">Envie exatamente</p>
            <p className="text-4xl font-bold text-accent-200 tabular-nums mt-2">
              {formatCurrency(withdraw.depositAmountCents / 100)}
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              Destinatário recebe {formatCurrency(withdraw.payoutAmountCents / 100)}
            </p>
          </div>

          {/* QR Placeholder */}
          <div className="bg-neutral-100 rounded-xl p-6">
            <div className="w-[180px] h-[180px] flex items-center justify-center">
              <Logo size="lg" className="opacity-30" />
            </div>
          </div>

          {/* Address */}
          <div className="w-full max-w-xl flex flex-col gap-3">
            <p className="text-sm text-neutral-400 text-center">Endereço Liquid (DePix)</p>
            <div className="border border-border rounded-xl p-4 bg-surface">
              <p className="text-xs font-mono text-neutral-400 break-all text-center leading-relaxed">
                {withdraw.flyerxAddress}
              </p>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copiado!' : 'Copiar endereço'}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleNewWithdraw}>
              <ArrowUpRight className="size-4" />
              Novo PIX
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost">
                <Home className="size-4" />
                Início
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Step 3: Confirmed */}
      {step === 3 && withdraw && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="size-16 rounded-full bg-accent-900/30 border border-accent-700 flex items-center justify-center">
            <Check className="size-7 text-accent-300" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">PIX enviado!</h2>
            <p className="text-sm text-neutral-500 mt-1">
              O destinatário receberá em instantes
            </p>
          </div>

          <p className="text-4xl font-bold text-accent-200 tabular-nums">
            {formatCurrency(withdraw.payoutAmountCents / 100)}
          </p>

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleNewWithdraw}>
              <ArrowUpRight className="size-4" />
              Novo PIX
            </Button>
            <Link href="/history">
              <Button variant="secondary">
                <ExternalLink className="size-4" />
                Ver histórico
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto pt-1 text-xs text-neutral-600">
        <span>© 2026 Flyerx</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-neutral-400">
            Privacidade
          </Link>
          <Link href="/terms" className="hover:text-neutral-400">
            Termos
          </Link>
        </div>
      </div>
    </Container>
  );
}
