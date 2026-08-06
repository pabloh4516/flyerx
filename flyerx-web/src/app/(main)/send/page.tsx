'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CreditCard,
  Send,
  Check,
  User,
  Building2,
  Mail,
  Phone,
  Key,
  Info,
  Copy,
  Home,
  ExternalLink,
  Loader2,
  Clock,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
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
  valueInCents: number;
  status: Pix2DepixWithdrawStatus;
}

const pixKeyTypes: { type: PixKeyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'CPF', label: 'CPF', icon: User },
  { type: 'CNPJ', label: 'CNPJ', icon: Building2 },
  { type: 'EMAIL', label: 'Email', icon: Mail },
  { type: 'PHONE', label: 'Tel', icon: Phone },
  { type: 'RANDOM', label: 'Aleatória', icon: Key },
];

const steps = [
  { id: 1, label: 'Solicitar', icon: CreditCard },
  { id: 2, label: 'Pagar', icon: Send },
  { id: 3, label: 'Confirmação', icon: Check },
];

export default function SellerSendPage() {
  const user = useAuthStore((state) => state.user);
  const { feeConfig, limits } = useFeesStore();

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
      amount: 500,
    },
  });

  const amount = watch('amount');
  const pixKeyType = watch('pixKeyType');
  const fee = feeConfig.withdraw.partnerFixedFee + (amount * feeConfig.withdraw.partnerPercentFee);

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
        valueInCents: Math.round(data.amount * 100),
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
    setValue('amount', 500);
    setValue('pixKey', '');
  };

  return (
    <Container size="lg" padded={false} className="p-7 flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-lg border border-neutral-700 bg-gradient-to-br from-neutral-900 to-transparent text-neutral-300 flex items-center justify-center">
          <ArrowUpRight className="size-5" />
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-xl font-medium">Enviar PIX</span>
          <span className="text-xs text-neutral-500">
            Pague com DePix, receba via PIX
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <span
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-xs border transition-colors',
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
                  step > s.id ? 'bg-accent-700' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Request */}
      {step === 1 && (
        <div className="grid grid-cols-[1fr_0.85fr] gap-11 items-start">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-md border border-border text-neutral-300 flex items-center justify-center">
                <Check className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Fazer PIX</span>
                <span className="text-xs text-neutral-600">
                  Mín: R$ {limits.withdraw.min.toFixed(2).replace('.', ',')} | Máx: R$ {limits.withdraw.max.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* PIX key type */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                Tipo de chave PIX
              </span>
              <div className="flex gap-2">
                {pixKeyTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('pixKeyType', type)}
                    className={cn(
                      'flex-1 border rounded-md p-3 flex flex-col items-center gap-1.5 transition-colors',
                      pixKeyType === type
                        ? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent-200'
                        : 'border-border text-neutral-400 hover:border-neutral-700'
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PIX key input */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                Chave PIX
              </span>
              <Input
                type="text"
                placeholder={
                  pixKeyType === 'CPF' ? '000.000.000-00' :
                  pixKeyType === 'CNPJ' ? '00.000.000/0000-00' :
                  pixKeyType === 'EMAIL' ? 'email@exemplo.com' :
                  pixKeyType === 'PHONE' ? '(00) 00000-0000' :
                  'Chave aleatória'
                }
                {...register('pixKey')}
              />
              {errors.pixKey && (
                <p className="text-xs text-destructive">{errors.pixKey.message}</p>
              )}
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                Valor líquido
              </span>
              <div className="flex items-baseline gap-2 border border-accent-800 rounded-lg p-3.5 bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)] tabular-nums">
                <span className="text-sm text-neutral-500">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min={limits.withdraw.min}
                  max={limits.withdraw.max}
                  className="text-2xl font-medium h-auto py-0 px-0 border-0 bg-transparent focus-visible:ring-0 w-32"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="solid"
              size="lg"
              fullWidth
              disabled={createWithdraw.isPending}
            >
              {createWithdraw.isPending && <Loader2 className="size-4 animate-spin" />}
              <Check className="size-4" />
              Pagar PIX
            </Button>
          </form>

          {/* How it works */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-md border border-accent-800 bg-accent-900 text-accent-300 flex items-center justify-center">
                <Info className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Como funciona</span>
                <span className="text-xs text-neutral-600">
                  Passo a passo simples
                </span>
              </div>
            </div>

            {[
              { icon: CreditCard, title: 'Informe a chave PIX', desc: 'Selecione o tipo e digite sua chave' },
              { icon: Send, title: 'Pague na sua wallet', desc: 'Escaneie o QR ou copie o endereço' },
              { icon: Check, title: 'Receba o PIX', desc: 'O sistema processa automaticamente' },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-border rounded-lg p-3.5 flex gap-3 items-center bg-[color-mix(in_srgb,var(--color-surface)_50%,transparent)]"
              >
                <div className="size-8 rounded-md border border-border flex items-center justify-center relative text-neutral-300 shrink-0">
                  <item.icon className="size-3.5" />
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-accent-800 text-accent-200 text-[9px] flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-neutral-500">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Pay */}
      {step === 2 && withdraw && (
        <>
          {/* Status bar */}
          <div className="border border-border rounded-lg p-3.5 flex items-center gap-3.5 bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)]">
            <div className="size-10 rounded-lg border border-amber-700 bg-amber-900 text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-sm font-medium text-amber-300">
                Aguardando pagamento
              </span>
              <span className="text-xs text-neutral-500">
                Envie DePix para o endereço abaixo
              </span>
            </div>
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => {}}>
              <RefreshCw className="size-3.5" />
              Atualizar
            </Button>
            <Button variant="primary" size="sm" className="gap-2" onClick={handleNewWithdraw}>
              <ArrowUpRight className="size-3.5" />
              Novo PIX
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-11 items-start">
            {/* QR Code */}
            <div className="flex flex-col gap-4 items-center">
              <div className="flex items-center gap-3 self-start">
                <div className="size-10 rounded-md border border-border text-neutral-300 flex items-center justify-center">
                  <Send className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Endereço DePix</span>
                  <span className="text-xs text-neutral-600">
                    Envie de sua wallet Liquid
                  </span>
                </div>
              </div>

              <div className="bg-neutral-100 rounded-lg p-5 shadow-md">
                <div className="w-[210px] h-[210px] flex items-center justify-center">
                  <Logo size="lg" className="opacity-50" />
                </div>
              </div>

              {/* Amount */}
              <div className="border border-accent rounded-md px-6 py-3 flex flex-col gap-0.5 items-center bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]">
                <span className="text-[10px] text-accent-300 uppercase tracking-wider">Valor a enviar</span>
                <span className="text-xl font-medium text-accent-200 tabular-nums">
                  {formatCurrency(amount + fee)} DePix
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md border border-border text-neutral-300 flex items-center justify-center">
                  <Copy className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Endereço Liquid</span>
                  <span className="text-xs text-neutral-600">
                    Copie e cole na sua wallet
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3.5 bg-[color-mix(in_srgb,var(--color-surface)_70%,transparent)]">
                <span className="text-xs font-mono text-neutral-400 leading-relaxed break-all">
                  {withdraw.flyerxAddress}
                </span>
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Endereço copiado!' : 'Copiar endereço'}
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
      {step === 3 && withdraw && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="size-16 rounded-full border border-accent bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] flex items-center justify-center text-accent-300 shadow-[0_0_40px_color-mix(in_srgb,var(--color-accent)_30%,transparent)]">
            <Check className="size-7" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-medium">PIX enviado</span>
            <span className="text-xs text-neutral-500">
              O destinatário receberá em instantes
            </span>
          </div>

          <div className="text-4xl font-medium text-accent-200 tabular-nums">
            {formatCurrency(amount)}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleNewWithdraw}>
              <ArrowUpRight className="size-4" />
              Novo PIX
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
