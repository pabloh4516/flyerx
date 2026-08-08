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
  Home,
  ExternalLink,
  Loader2,
  CreditCard,
  QrCode,
  Zap,
} from 'lucide-react';

import { Button, Input, Container } from '@/components/ui';
import { StepsGuide } from '@/components/ui/steps-guide';

import {
  useCreateWithdrawal,
  useWithdrawal,
  useInvalidateWalletData,
} from '@/hooks/use-queries';
import { useAuthStore } from '@/stores/auth';
import { useFeesStore } from '@/stores/fees';
import { formatCurrency } from '@/lib/validations/transactions';
import { cn } from '@/lib/utils';
import type { PixKeyType } from '@/types';

const formSchema = z.object({
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']),
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
  payoutAmountCents: number;
  status: string;
}

const pixKeyTypes: { type: PixKeyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'cpf', label: 'CPF', icon: User },
  { type: 'cnpj', label: 'CNPJ', icon: Building2 },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Tel', icon: Phone },
  { type: 'random', label: 'Aleatória', icon: Key },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

// Normaliza a chave PIX para o formato esperado pela API
const normalizePixKey = (pixKey: string, keyType: PixKeyType): string => {
  if (keyType === 'phone') {
    // Remove tudo que não é dígito
    const digits = pixKey.replace(/\D/g, '');
    // Se não começar com 55, adiciona +55
    if (digits.startsWith('55')) {
      return `+${digits}`;
    }
    return `+55${digits}`;
  }
  if (keyType === 'cpf' || keyType === 'cnpj') {
    // Remove formatação
    return pixKey.replace(/\D/g, '');
  }
  return pixKey;
};

// Normaliza e extrai CPF/CNPJ da chave PIX
const extractTaxNumber = (pixKey: string, keyType: PixKeyType): string | null => {
  if (keyType === 'cpf' || keyType === 'cnpj') {
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

  const [step, setStep] = useState(1);
  const [withdraw, setWithdraw] = useState<WithdrawState | null>(null);

  const invalidateWalletData = useInvalidateWalletData();
  const createWithdrawalMutation = useCreateWithdrawal();
  const { data: withdrawalData } = useWithdrawal(withdraw?.id ?? '', !!withdraw);

  // TODO: Implementar limite diário no Laravel
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dailyLimit = null as { daily_volume_reais: number; daily_limit_reais: number; remaining_reais: number } | null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pixKeyType: 'cpf',
      pixKey: '',
      recipientTaxNumber: '',
    },
  });

  const amount = watch('amount') || 0;
  const pixKeyType = watch('pixKeyType');
  const pixKey = watch('pixKey');
  const recipientTaxNumber = watch('recipientTaxNumber');

  // Se a chave é CPF/CNPJ, não precisa do campo extra
  const needsTaxNumber = pixKeyType !== 'cpf' && pixKeyType !== 'cnpj';

  // Cálculo de taxa (apenas Eulen, sem taxa de parceiro por enquanto)
  const eulenFee = Math.max(
    feeConfig.withdraw.eulenMinFee,
    amount * feeConfig.withdraw.eulenPercentFee
  );
  const fee = eulenFee;
  const totalToSend = amount + fee;

  // Update status from polling
  if (withdrawalData && withdraw) {
    if (withdraw.status !== withdrawalData.status) {
      setWithdraw({
        ...withdraw,
        status: withdrawalData.status,
      });

      if (withdrawalData.status === 'COMPLETED') {
        setStep(3);
        toast.success('PIX enviado com sucesso!');
        invalidateWalletData();
      }
    }
  }

  const onSubmit = async (data: FormData) => {
    // Determina o document do TITULAR da chave PIX
    let recipientDocument: string;

    if (data.pixKeyType === 'cpf' || data.pixKeyType === 'cnpj') {
      // Se a chave É CPF/CNPJ, extraímos o número dela mesma
      recipientDocument = data.pixKey.replace(/\D/g, '');
    } else {
      // Se é outro tipo, usamos o campo que o usuário preencheu
      if (!data.recipientTaxNumber || !isValidTaxNumber(data.recipientTaxNumber)) {
        toast.error('Informe o CPF/CNPJ do titular da chave PIX');
        return;
      }
      recipientDocument = data.recipientTaxNumber.replace(/\D/g, '');
    }

    // Normaliza a chave PIX (adiciona +55 em telefones, remove formatação de CPF/CNPJ)
    const normalizedPixKey = normalizePixKey(data.pixKey, data.pixKeyType);

    try {
      // Chama Laravel que processa via Eulen
      const result = await createWithdrawalMutation.mutateAsync({
        pix_key: normalizedPixKey,
        pix_key_type: data.pixKeyType,
        amount: data.amount,
        recipient_document: recipientDocument,
      });

      setWithdraw({
        id: result.id,
        payoutAmountCents: Math.round(data.amount * 100),
        status: result.status,
      });

      setStep(3); // Saque custodial não precisa de step 2 (enviar DePix)
      toast.success('Saque solicitado com sucesso!');
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
                dailyLimit !== null && dailyLimit.remaining_reais <= 0 ? "bg-destructive" : "bg-accent-500"
              )}
              style={{ width: `${dailyLimit !== null ? Math.min((dailyLimit.daily_volume_reais / dailyLimit.daily_limit_reais) * 100, 100) : 0}%` }}
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
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-neutral-700"
                  onChange={(e) => {
                    // Permite vírgula e ponto, converte para número
                    const value = e.target.value.replace(',', '.');
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                      setValue('amount', num, { shouldValidate: true });
                    } else if (value === '' || value === '.' || value === ',') {
                      setValue('amount', 0, { shouldValidate: true });
                    }
                  }}
                  defaultValue=""
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
                  pixKeyType === 'cpf' ? '000.000.000-00' :
                  pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                  pixKeyType === 'email' ? 'email@exemplo.com' :
                  pixKeyType === 'phone' ? '(00) 00000-0000' :
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
                createWithdrawalMutation.isPending ||
                !amount ||
                !pixKey ||
                (needsTaxNumber && (!recipientTaxNumber || !isValidTaxNumber(recipientTaxNumber)))
              }
            >
              {createWithdrawalMutation.isPending && <Loader2 className="size-4 animate-spin" />}
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

      {/* Step 2: Processing - mostrado enquanto processa */}
      {step === 2 && withdraw && (
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Status */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-full border border-amber-700/50 bg-amber-900/20">
            <Loader2 className="size-4 text-amber-400 animate-spin" />
            <span className="text-sm text-amber-300">Processando saque...</span>
          </div>

          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-neutral-500">Enviando</p>
            <p className="text-4xl font-bold text-accent-200 tabular-nums mt-2">
              {formatCurrency(withdraw.payoutAmountCents / 100)}
            </p>
          </div>

          <p className="text-sm text-neutral-500">
            O PIX será enviado em instantes
          </p>
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
