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
} from 'lucide-react';

import { Button, Input, Container } from '@/components/ui';
import { Logo } from '@/components/ui/nocturne';

import { useCreatePix2DepixWithdraw, usePix2DepixWithdrawStatus, useInvalidateWalletData } from '@/hooks/use-queries';
import { useAuthStore } from '@/stores/auth';
import { useFeesStore } from '@/stores/fees';
import { formatCurrency } from '@/lib/validations/transactions';
import { cn } from '@/lib/utils';
import type { PixKeyType } from '@/types';
import type { Pix2DepixWithdrawStatus } from '@/types/pix2depix';

const formSchema = z.object({
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']),
  pixKey: z.string().min(1, 'Informe a chave PIX'),
  amount: z
    .number({ message: 'Informe um valor' })
    .min(20, 'Mínimo R$ 20,00')
    .max(50000, 'Máximo R$ 50.000,00'),
});

type FormData = z.infer<typeof formSchema>;

interface WithdrawState {
  id: string;
  flyerxAddress: string;
  payoutAmountCents: number;
  depositAmountCents: number;
  status: Pix2DepixWithdrawStatus;
}

const pixKeyTypes: { type: PixKeyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'CPF', label: 'CPF', icon: User },
  { type: 'CNPJ', label: 'CNPJ', icon: Building2 },
  { type: 'EMAIL', label: 'Email', icon: Mail },
  { type: 'PHONE', label: 'Tel', icon: Phone },
  { type: 'RANDOM', label: 'Aleatória', icon: Key },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function SellerSendPage() {
  const user = useAuthStore((state) => state.user);
  const { limits, feeConfig } = useFeesStore();

  const [step, setStep] = useState(1);
  const [withdraw, setWithdraw] = useState<WithdrawState | null>(null);
  const [copied, setCopied] = useState(false);

  const invalidateWalletData = useInvalidateWalletData();
  const createWithdraw = useCreatePix2DepixWithdraw();
  const { data: withdrawStatus } = usePix2DepixWithdrawStatus(withdraw?.id ?? '', !!withdraw);

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
      amount: 0,
    },
  });

  const amount = watch('amount') || 0;
  const pixKeyType = watch('pixKeyType');
  const pixKey = watch('pixKey');

  // Cálculo de taxa (1% mín R$ 1,00)
  const fee = Math.max(
    feeConfig.withdraw.eulenMinFee,
    amount * feeConfig.withdraw.eulenPercentFee
  );
  const totalToSend = amount + fee;

  // Update status from polling
  if (withdrawStatus && withdraw) {
    if (withdraw.status !== withdrawStatus.status) {
      setWithdraw({
        ...withdraw,
        status: withdrawStatus.status,
      });

      if (withdrawStatus.status === 'sent') {
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
    if (!user?.document || !user?.euid) {
      toast.error('Dados do usuário não encontrados');
      return;
    }

    try {
      const result = await createWithdraw.mutateAsync({
        pixKey: data.pixKey,
        taxNumber: user.document,
        euid: user.euid,
        amountReais: data.amount,
        isPayoutAmount: true,
      });

      setWithdraw({
        id: result.withdrawalId,
        flyerxAddress: result.depositAddress,
        payoutAmountCents: result.payoutAmountInCents,
        depositAmountCents: result.depositAmountInCents,
        status: 'unsent',
      });

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
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-6 min-h-full">
      {/* Step 1: Amount - CENTERED HERO LAYOUT */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-6">
          {/* Header Card */}
          <div className="w-full max-w-xl p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-accent-900/30 border border-accent-700/50 flex items-center justify-center">
                  <Send className="size-5 text-accent-300" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Enviar PIX</h1>
                  <p className="text-xs text-neutral-500">Envie para qualquer chave PIX</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Taxa</p>
                <p className="text-sm font-medium text-primary">{feeDisplay}</p>
              </div>
            </div>
          </div>

          {/* HERO: Amount display */}
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-sm text-neutral-500">Destinatário recebe</span>
            <div className="flex items-baseline gap-1">
              <span className="text-neutral-500 text-2xl">R$</span>
              <span className="text-6xl font-bold tabular-nums text-foreground">
                {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {amount > 0 && (
              <p className="text-sm text-neutral-600">
                Você paga {formatCurrency(totalToSend)} (taxa {formatCurrency(fee)})
              </p>
            )}
          </div>

          {/* Amount input */}
          <div className="w-full max-w-xl flex flex-col gap-1.5">
            <label className="text-xs text-neutral-500 uppercase tracking-wide">Valor</label>
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
              <p className="text-xs text-destructive text-center">{errors.amount.message}</p>
            )}

            {/* Quick amounts - pills */}
            <div className="flex justify-center gap-2 flex-wrap">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('amount', value, { shouldValidate: true })}
                  className={cn(
                    'px-4 py-1.5 text-sm rounded-full transition-all',
                    amount === value
                      ? 'bg-neutral-700 text-neutral-100 font-medium'
                      : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* PIX Key Type - pills */}
          <div className="w-full max-w-xl flex flex-col gap-2">
            <span className="text-sm text-neutral-400 text-center">Tipo de chave</span>
            <div className="flex justify-center gap-2">
              {pixKeyTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('pixKeyType', type)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
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
          <div className="w-full max-w-xl flex flex-col gap-2">
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
              <p className="text-xs text-destructive text-center">{errors.pixKey.message}</p>
            )}
          </div>

          {/* CTA */}
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full max-w-xl"
            disabled={createWithdraw.isPending || !amount || !pixKey}
          >
            {createWithdraw.isPending && <Loader2 className="size-4 animate-spin" />}
            <Send className="size-4" />
            Enviar PIX
          </Button>
        </form>
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
