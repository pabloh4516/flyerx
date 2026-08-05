'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  HelpCircle,
  Settings,
  CreditCard,
  QrCode,
  Check,
  Clock,
  Zap,
  Shield,
  Copy,
  RefreshCw,
  ExternalLink,
  Home,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/nocturne';

import { useCreatePix2DepixDeposit, usePix2DepixDepositStatus, useInvalidateWalletData } from '@/hooks/use-queries';
import { useAuthStore } from '@/stores/auth';
import { useFeesStore } from '@/stores/fees';
import { formatCurrency } from '@/lib/validations/transactions';
import { cn } from '@/lib/utils';
import type { Pix2DepixDepositStatus } from '@/types/pix2depix';

const formSchema = z.object({
  amount: z
    .number({ message: 'Informe um valor' })
    .min(6, 'Mínimo R$ 6,00')
    .max(50000, 'Máximo R$ 50.000,00'),
  payerDocument: z
    .string()
    .min(11, 'Informe o CPF ou CNPJ')
    .max(18, 'Documento inválido'),
});

type FormData = z.infer<typeof formSchema>;

interface DepositState {
  id: string;
  qrCopyPaste: string;
  qrImageUrl: string;
  valueInCents: number;
  expiration: string;
  status: Pix2DepixDepositStatus;
}

const QUICK_AMOUNTS = [50, 100, 200, 500];

const steps = [
  { id: 1, label: 'Valor', icon: CreditCard },
  { id: 2, label: 'Pagar PIX', icon: QrCode },
  { id: 3, label: 'Confirmado', icon: Check },
];

const formatDocument = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export default function SellerReceivePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { feeConfig, limits, getDefaultWallet } = useFeesStore();

  const [step, setStep] = useState(1);
  const [deposit, setDeposit] = useState<DepositState | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const invalidateWalletData = useInvalidateWalletData();
  const createDeposit = useCreatePix2DepixDeposit();
  const { data: depositStatus } = usePix2DepixDepositStatus(deposit?.id ?? '', !!deposit);

  const defaultWallet = getDefaultWallet();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 20,
      payerDocument: '',
    },
  });

  const amount = watch('amount');
  const fee = feeConfig.deposit.eulenFixedFee + feeConfig.deposit.partnerFixedFee;
  const netAmount = amount > fee ? amount - fee : 0;

  // Update status from polling
  if (depositStatus && deposit) {
    if (deposit.status !== depositStatus.status) {
      setDeposit({
        ...deposit,
        status: depositStatus.status,
      });

      if (depositStatus.status === 'depix_sent') {
        setStep(3);
        toast.success('Depósito confirmado!');
        invalidateWalletData();
      }
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value);
    setValue('payerDocument', formatted, { shouldValidate: true });
  };

  const handleCopy = async () => {
    if (!deposit?.qrCopyPaste) return;
    try {
      await navigator.clipboard.writeText(deposit.qrCopyPaste);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!defaultWallet) {
      toast.error('Configure uma carteira primeiro');
      return;
    }

    try {
      const result = await createDeposit.mutateAsync({
        amountReais: data.amount,
        endUserTaxNumber: data.payerDocument.replace(/\D/g, ''),
        depixAddress: defaultWallet.address,
      });

      setDeposit({
        id: result.id,
        qrCopyPaste: result.qrCopyPaste,
        qrImageUrl: result.qrImageUrl,
        valueInCents: Math.round(data.amount * 100),
        expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });

      setStep(2);
      toast.success('QR Code gerado!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar depósito';
      toast.error(message);
    }
  };

  const handleNewDeposit = () => {
    setDeposit(null);
    setStep(1);
    setValue('amount', 20);
    setValue('payerDocument', '');
  };

  return (
    <div className="p-7 flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-[46px] h-[46px] rounded-[14px] border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent text-accent-300 flex items-center justify-center">
          <ArrowDownLeft className="size-5" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-[21px] font-medium">Receber PIX</span>
          <span className="text-[12.5px] text-neutral-500">
            Receba em DePix instantaneamente
          </span>
        </div>
        <button className="w-9 h-9 rounded-[--radius-md] border border-border flex items-center justify-center text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
          <HelpCircle className="size-4" />
        </button>
        <button className="w-9 h-9 rounded-[--radius-md] border border-border flex items-center justify-center text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
          <Settings className="size-4" />
        </button>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <span
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-[12.5px] border transition-colors',
                step === s.id
                  ? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent-200 font-medium'
                  : step > s.id
                  ? 'border-accent-700 text-accent-300'
                  : 'border-border text-neutral-500'
              )}
            >
              {step > s.id ? (
                <Check className="size-3.5" />
              ) : (
                <s.icon className="size-3.5" />
              )}
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  'w-14 h-px',
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
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[10px] border border-border text-neutral-300 flex items-center justify-center">
                <CreditCard className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14.5px] font-medium">Valor do depósito</span>
                <span className="text-[11.5px] text-neutral-600">
                  Mín: R$ {limits.deposit.min.toFixed(2).replace('.', ',')} | Máx: R$ {limits.deposit.max.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Security notice */}
            <div className="border border-amber-800 rounded-[--radius-md] p-3 flex gap-2.5 items-start bg-amber-900/30">
              <Shield className="size-3.5 shrink-0 mt-0.5 text-amber-300" />
              <span className="text-[12px] text-neutral-400 leading-relaxed">
                Seu primeiro depósito é limitado a{' '}
                <span className="text-white font-medium">R$ 20,00</span> por
                segurança. A partir do segundo, o limite normal será aplicado.
              </span>
            </div>

            {/* Amount input */}
            <div className="border border-border rounded-[--radius-md] p-4 flex flex-col gap-1.5 bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)]">
              <span className="text-[10.5px] text-neutral-500 uppercase tracking-wider">
                Você deposita
              </span>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-[15px] text-neutral-500">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min={limits.deposit.min}
                  max={limits.deposit.max}
                  className="text-[34px] font-medium h-auto py-0 px-0 border-0 bg-transparent focus-visible:ring-0 w-32"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-[12px] text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('amount', value, { shouldValidate: true })}
                  className={cn(
                    'tag whitespace-nowrap px-4 py-2 text-[12px]',
                    amount === value ? 'tag-accent' : 'tag-outline'
                  )}
                >
                  R$ {value.toLocaleString('pt-BR')},00
                </button>
              ))}
            </div>

            {/* Payer document */}
            <div className="flex flex-col gap-2">
              <span className="text-[10.5px] text-neutral-500 uppercase tracking-wider">
                CPF/CNPJ de quem vai pagar
              </span>
              <Input
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                {...register('payerDocument')}
                onChange={handleDocumentChange}
              />
              <span className="text-[11px] text-neutral-600 leading-relaxed">
                O provedor exige o CPF/CNPJ do pagador para gerar o QR. Informe os
                dados de quem fará o PIX.
              </span>
              {errors.payerDocument && (
                <p className="text-[12px] text-destructive">{errors.payerDocument.message}</p>
              )}
            </div>

            {/* Net amount preview */}
            <div className="border border-transparent rounded-[--radius-md] bg-[linear-gradient(color-mix(in_srgb,var(--color-section)_60%,var(--color-bg)),color-mix(in_srgb,var(--color-section)_60%,var(--color-bg)))_padding-box,linear-gradient(120deg,var(--color-accent-600),var(--color-accent-900))_border-box] p-4 flex flex-col gap-1">
              <span className="text-[10.5px] text-accent-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="size-3" />
                Você recebe em DePix
              </span>
              <span className="text-[28px] font-medium tabular-nums">
                {formatCurrency(netAmount)}
              </span>
              <span className="text-[11.5px] text-neutral-500">
                Taxa fixa − {formatCurrency(fee)}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={createDeposit.isPending || !defaultWallet}
            >
              {createDeposit.isPending && <Loader2 className="size-4 animate-spin" />}
              <QrCode className="size-4" />
              Gerar QR Code PIX
            </Button>
          </form>

          {/* How it works */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[10px] border border-accent-800 bg-accent-900 text-accent-300 flex items-center justify-center">
                <Zap className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14.5px] font-medium">Como funciona</span>
                <span className="text-[11.5px] text-neutral-600">
                  Passo a passo simples
                </span>
              </div>
            </div>

            {[
              { step: 1, title: 'Digite o valor', desc: 'Informe quanto deseja depositar em Reais' },
              { step: 2, title: 'Pague o PIX', desc: 'Use seu app do banco para escanear ou colar' },
              { step: 3, title: 'Receba em DePix', desc: 'Creditado automaticamente na sua carteira' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3.5">
                <div className="w-[30px] h-[30px] rounded-[9px] bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[12.5px] font-medium text-accent-300 shrink-0">
                  {item.step}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] font-medium">{item.title}</span>
                  <span className="text-[12px] text-neutral-500">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: QR Code */}
      {step === 2 && deposit && (
        <>
          {/* Status bar */}
          <div className="border border-border rounded-[--radius-md] p-3.5 flex items-center gap-3.5 bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)]">
            <div className="w-10 h-10 rounded-[11px] border border-amber-700 bg-amber-900 text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="size-4.5" />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-[14px] font-medium text-amber-300">
                Aguardando pagamento
              </span>
              <span className="text-[12px] text-neutral-500">
                Expira em <span className="text-white font-medium tabular-nums">24:00:00</span>
              </span>
            </div>
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => {}}>
              <RefreshCw className="size-3.5" />
              Atualizar
            </Button>
            <Button variant="primary" size="sm" className="gap-2" onClick={handleNewDeposit}>
              <QrCode className="size-3.5" />
              Novo PIX
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-11 items-start">
            {/* QR Code */}
            <div className="flex flex-col gap-4 items-center">
              <div className="flex items-center gap-3 self-start">
                <div className="w-[38px] h-[38px] rounded-[10px] border border-border text-neutral-300 flex items-center justify-center">
                  <QrCode className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-medium">QR Code PIX</span>
                  <span className="text-[11.5px] text-neutral-600">
                    Escaneie com seu banco
                  </span>
                </div>
              </div>

              <div className="bg-neutral-100 rounded-[--radius-lg] p-4.5 shadow-md">
                {deposit.qrImageUrl ? (
                  <img src={deposit.qrImageUrl} alt="QR Code PIX" className="w-[210px] h-[210px]" />
                ) : (
                  <div className="w-[210px] h-[210px] flex items-center justify-center">
                    <Logo size="lg" className="opacity-50" />
                  </div>
                )}
              </div>

              {/* Amount breakdown */}
              <div className="flex gap-2.5 justify-center">
                <div className="border border-border rounded-[--radius-md] px-4 py-2.5 flex flex-col gap-0.5 items-center">
                  <span className="text-[9.5px] text-neutral-600 uppercase tracking-wider">Bruto</span>
                  <span className="text-[14px] font-medium tabular-nums">{formatCurrency(amount)}</span>
                </div>
                <div className="border border-border rounded-[--radius-md] px-4 py-2.5 flex flex-col gap-0.5 items-center">
                  <span className="text-[9.5px] text-neutral-600 uppercase tracking-wider">Taxa</span>
                  <span className="text-[14px] font-medium text-neutral-400 tabular-nums">− {formatCurrency(fee)}</span>
                </div>
                <div className="border border-accent rounded-[--radius-md] px-4 py-2.5 flex flex-col gap-0.5 items-center bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]">
                  <span className="text-[9.5px] text-accent-300 uppercase tracking-wider">Líquido</span>
                  <span className="text-[14px] font-medium text-accent-200 tabular-nums">{formatCurrency(netAmount)}</span>
                </div>
              </div>
            </div>

            {/* Copy paste code */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] border border-border text-neutral-300 flex items-center justify-center">
                  <Copy className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-medium">PIX Copia e Cola</span>
                  <span className="text-[11.5px] text-neutral-600">
                    Cole no app do banco
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-[--radius-md] p-3.5 bg-[color-mix(in_srgb,var(--color-surface)_70%,transparent)]">
                <span className="text-[11px] font-mono text-neutral-400 leading-relaxed break-all">
                  {deposit.qrCopyPaste}
                </span>
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Código copiado!' : 'Copiar código PIX'}
              </Button>

              <div className="flex gap-2.5">
                <Link href="/history" className="flex-1">
                  <Button variant="secondary" fullWidth className="gap-2">
                    <ExternalLink className="size-3.5" />
                    Ver extrato
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="secondary" fullWidth className="gap-2">
                    <Home className="size-3.5" />
                    Início
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Confirmed */}
      {step === 3 && deposit && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="w-16 h-16 rounded-full border border-accent bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] flex items-center justify-center text-accent-300 shadow-[0_0_40px_color-mix(in_srgb,var(--color-accent)_30%,transparent)]">
            <Check className="size-7" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[19px] font-medium">Depósito confirmado</span>
            <span className="text-[12.5px] text-neutral-500">
              Creditado na sua carteira Flyerx
            </span>
          </div>

          <div className="text-[36px] font-medium text-accent-200 tabular-nums">
            {formatCurrency(netAmount)}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleNewDeposit}>
              <QrCode className="size-4" />
              Novo depósito
            </Button>
            <Link href="/dashboard">
              <Button variant="secondary">
                <Home className="size-4" />
                Voltar ao início
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto pt-1 text-[11px] text-neutral-600">
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
    </div>
  );
}
