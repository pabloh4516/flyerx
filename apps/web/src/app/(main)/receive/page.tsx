'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Settings,
  CreditCard,
  QrCode,
  Check,
  Clock,
  Zap,
  Copy,
  RefreshCw,
  ExternalLink,
  Home,
  Loader2,
  Wallet,
  Plus,
  AlertTriangle,
  User,
  Download,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Container } from '@/components/ui/container';
import { StepsGuide } from '@/components/ui/steps-guide';
import { Modal } from '@/components/ui/modal';
import { Logo } from '@/components/ui/nocturne';

import { useCreatePix2DepixDeposit, usePix2DepixDepositStatus, useInvalidateWalletData, useDailyLimit } from '@/hooks/use-queries';
import { useAuthStore } from '@/stores/auth';
import { useFeesStore } from '@/stores/fees';
import { formatCurrency } from '@/lib/validations/transactions';
import { calculateDepositFee, formatFeeDisplay } from '@/types/fees';
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
  const { feeConfig, limits, wallets, getDefaultWallet, addWallet, setDefaultWallet } = useFeesStore();

  const [step, setStep] = useState(1);
  const [deposit, setDeposit] = useState<DepositState | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [showCpfConfirmModal, setShowCpfConfirmModal] = useState(false);
  const [cpfConfirmed, setCpfConfirmed] = useState(false);
  const [passToCustomer, setPassToCustomer] = useState(false);

  const invalidateWalletData = useInvalidateWalletData();
  const createDeposit = useCreatePix2DepixDeposit();
  const { data: depositStatus } = usePix2DepixDepositStatus(deposit?.id ?? '', !!deposit);

  const defaultWallet = getDefaultWallet();

  const handleAddWallet = () => {
    if (!newWalletName.trim() || !newWalletAddress.trim()) {
      toast.error('Preencha nome e endereço');
      return;
    }
    if (!newWalletAddress.startsWith('lq1') && !newWalletAddress.startsWith('ex1')) {
      toast.error('Endereço Liquid inválido');
      return;
    }
    addWallet({
      label: newWalletName.trim(),
      address: newWalletAddress.trim(),
      isDefault: wallets.length === 0,
    });
    toast.success('Carteira adicionada!');
    setNewWalletName('');
    setNewWalletAddress('');
    setIsAddingWallet(false);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      payerDocument: '',
    },
  });

  const amount = watch('amount') || 0;
  const payerDocument = watch('payerDocument') || '';

  // Consultar limite diário do CPF/CNPJ digitado
  const { data: dailyLimit, isLoading: isLoadingLimit } = useDailyLimit(payerDocument);

  // Calcular taxas usando a função correta
  const feeCalc = calculateDepositFee(amount, feeConfig.deposit, passToCustomer);
  const totalFee = feeCalc.totalFee;
  const netAmount = feeCalc.amountToReceive;
  const amountToCharge = feeCalc.amountToCharge;

  // Formato da taxa para o header: "2% + R$ 0,99"
  const feeDisplay = `${(feeConfig.deposit.partnerPercentFee * 100).toFixed(0)}% + R$ ${feeConfig.deposit.eulenFixedFee.toFixed(2).replace('.', ',')}`;

  // Verificar se o valor excede o limite diário disponível
  const exceedsLimit = dailyLimit && amount > dailyLimit.remaining_reais;

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

    // Resetar confirmação quando o CPF mudar
    setCpfConfirmed(false);

    // Abrir modal de confirmação quando CPF (11 dígitos) ou CNPJ (14 dígitos) estiver completo
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 14) {
      setShowCpfConfirmModal(true);
    }
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

    // Se CPF não foi confirmado, mostrar modal
    if (!cpfConfirmed) {
      setShowCpfConfirmModal(true);
      return;
    }

    // Criar depósito diretamente
    // Se passToCustomer, enviar amountToCharge (valor + taxa) para a API
    const pixAmount = passToCustomer ? amountToCharge : data.amount;

    try {
      const result = await createDeposit.mutateAsync({
        amountReais: pixAmount,
        endUserTaxNumber: data.payerDocument.replace(/\D/g, ''),
        depixAddress: defaultWallet.address,
        // Split: taxa Flyerx vai para a carteira da plataforma
        depixSplitAddress: feeConfig.deposit.partnerDepixAddress,
        splitFee: String(feeConfig.deposit.partnerPercentFee),
      });

      setDeposit({
        id: result.id,
        qrCopyPaste: result.qrCopyPaste,
        qrImageUrl: result.qrImageUrl,
        valueInCents: Math.round(pixAmount * 100),
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

  const handleConfirmCpf = () => {
    setCpfConfirmed(true);
    setShowCpfConfirmModal(false);
    toast.success('CPF/CNPJ confirmado!');
  };

  const handleNewDeposit = () => {
    setDeposit(null);
    setStep(1);
    setValue('amount', 20);
    setValue('payerDocument', '');
  };

  return (
    <Container size="lg" padded={false} className="p-7 flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-full bg-accent-900/30 border border-accent-700/50 flex items-center justify-center">
            <QrCode className="size-5 text-accent-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Receber PIX</h1>
            <p className="text-xs text-neutral-500">Gere um QR Code • Taxa {feeDisplay}</p>
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
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* HERO: Amount display */}
            <div className="flex flex-col items-center gap-2 py-3">
              <span className="text-sm text-neutral-500">Você vai receber</span>
              <div className="flex items-baseline gap-1">
                <span className="text-neutral-500 text-2xl">R$</span>
                <span className="text-5xl font-bold tabular-nums text-accent-200">
                  {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {amount > 0 && (
                <p className="text-sm text-neutral-500">
                  {passToCustomer ? (
                    <>Pagador paga {formatCurrency(amountToCharge)} (taxa {formatCurrency(totalFee)})</>
                  ) : (
                    <>Taxa de {formatCurrency(totalFee)}</>
                  )}
                </p>
              )}
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-500 uppercase tracking-wide">Valor do depósito</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border focus-within:border-primary transition-colors">
                <span className="text-neutral-500 text-lg">R$</span>
                <input
                  type="number"
                  step={0.01}
                  min={limits.deposit.min}
                  max={limits.deposit.max}
                  placeholder="0,00"
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
              {exceedsLimit && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">
                    Limite disponível: R$ {dailyLimit?.remaining_reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
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

            {/* Payer document */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 uppercase tracking-wide">
                  CPF/CNPJ do pagador
                </span>
                {dailyLimit && (
                  <span className="text-xs text-accent-300 font-medium">
                    Disponível: R$ {dailyLimit.remaining_reais.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                )}
                {isLoadingLimit && payerDocument.replace(/\D/g, '').length >= 11 && (
                  <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin" />
                    Consultando limite...
                  </span>
                )}
              </div>
              <Input
                type="text"
                placeholder="000.000.000-00"
                className="text-center text-lg"
                {...register('payerDocument')}
                onChange={handleDocumentChange}
              />
              <p className="text-xs text-neutral-600 text-center">
                A conta PIX precisa ser do mesmo CPF/CNPJ
              </p>
              {cpfConfirmed && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-accent-300">
                  <Check className="size-3" />
                  CPF/CNPJ confirmado
                </div>
              )}
              {errors.payerDocument && (
                <p className="text-xs text-destructive text-center">{errors.payerDocument.message}</p>
              )}
            </div>

            {/* Wallet + Pass fee toggle - same line */}
            <div className="flex items-center gap-3">
              {/* Wallet selector */}
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors',
                  defaultWallet
                    ? 'border-border bg-surface hover:border-neutral-600'
                    : 'border-amber-700/50 bg-amber-900/10'
                )}
              >
                <Wallet className="size-4 text-accent-300" />
                {defaultWallet ? (
                  <span className="text-sm font-medium">{defaultWallet.label}</span>
                ) : (
                  <span className="text-sm text-amber-300">+ Carteira</span>
                )}
              </button>

              {/* Pass fee toggle */}
              <div className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-surface">
                <span className="text-sm">Repassar taxa</span>
                <Switch
                  checked={passToCustomer}
                  onChange={(e) => setPassToCustomer(e.target.checked)}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="solid"
              size="lg"
              fullWidth
              disabled={createDeposit.isPending || !defaultWallet || exceedsLimit}
            >
              {createDeposit.isPending && <Loader2 className="size-4 animate-spin" />}
              <QrCode className="size-4" />
              Gerar QR Code
            </Button>
          </form>

          {/* How it works - aligned lower */}
          <div className="pt-14">
            <StepsGuide
              headerIcon={Zap}
              title="Como funciona"
              subtitle="Passo a passo simples"
              steps={[
                { icon: CreditCard, title: 'Digite o valor', description: 'Informe quanto deseja depositar em Reais' },
                { icon: QrCode, title: 'Pague o PIX', description: 'Use seu app do banco para escanear ou colar' },
                { icon: Check, title: 'Receba em DePix', description: 'Creditado automaticamente na sua carteira' },
              ]}
            />
          </div>
        </div>
      )}

      {/* Step 2: QR Code */}
      {step === 2 && deposit && (
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
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>ID: <span className="font-mono text-neutral-400">{deposit.id}</span></span>
                <span>•</span>
                <span>Expira em <span className="text-white font-medium tabular-nums">24:00:00</span></span>
              </div>
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
                <div className="size-10 rounded-md border border-border text-neutral-300 flex items-center justify-center">
                  <QrCode className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">QR Code PIX</span>
                  <span className="text-xs text-neutral-600">
                    Escaneie com seu banco
                  </span>
                </div>
              </div>

              <div className="bg-neutral-100 rounded-lg p-5 shadow-md">
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
                <div className="border border-border rounded-md px-4 py-2.5 flex flex-col gap-0.5 items-center">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Bruto</span>
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(amount)}</span>
                </div>
                <div className="border border-border rounded-md px-4 py-2.5 flex flex-col gap-0.5 items-center">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Taxa</span>
                  <span className="text-sm font-medium text-neutral-400 tabular-nums">− {formatCurrency(totalFee)}</span>
                </div>
                <div className="border border-accent rounded-md px-4 py-2.5 flex flex-col gap-0.5 items-center bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]">
                  <span className="text-[10px] text-accent-300 uppercase tracking-wider">Líquido</span>
                  <span className="text-sm font-medium text-accent-200 tabular-nums">{formatCurrency(netAmount)}</span>
                </div>
              </div>
            </div>

            {/* Copy paste code */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md border border-border text-neutral-300 flex items-center justify-center">
                  <Copy className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">PIX Copia e Cola</span>
                  <span className="text-xs text-neutral-600">
                    Cole no app do banco
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-3.5 bg-[color-mix(in_srgb,var(--color-surface)_70%,transparent)]">
                <span className="text-xs font-mono text-neutral-400 leading-relaxed break-all">
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
          <div className="size-16 rounded-full border border-accent bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] flex items-center justify-center text-accent-300 shadow-[0_0_40px_color-mix(in_srgb,var(--color-accent)_30%,transparent)]">
            <Check className="size-7" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-medium">Depósito confirmado</span>
            <span className="text-xs text-neutral-500">
              Creditado na sua carteira Flyerx
            </span>
          </div>

          <div className="text-4xl font-medium text-accent-200 tabular-nums">
            {formatCurrency(netAmount)}
          </div>

          {/* Transaction ID */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800/50 border border-border">
            <FileText className="size-4 text-neutral-500" />
            <span className="text-xs text-neutral-500">ID:</span>
            <span className="text-xs font-mono text-neutral-300">{deposit.id}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(deposit.id);
                toast.success('ID copiado!');
              }}
              className="ml-1 p-1 hover:bg-neutral-700 rounded transition-colors"
            >
              <Copy className="size-3 text-neutral-500" />
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleNewDeposit}>
              <QrCode className="size-4" />
              Novo depósito
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // TODO: Implementar download do comprovante
                toast.info('Comprovante será disponibilizado em breve');
              }}
            >
              <Download className="size-4" />
              Comprovante
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

      {/* Modal: Wallet Management */}
      <Modal
        open={showWalletModal}
        onClose={() => {
          setShowWalletModal(false);
          setIsAddingWallet(false);
          setNewWalletName('');
          setNewWalletAddress('');
        }}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="size-9 rounded-lg bg-accent-900/30 border border-accent-700/50 flex items-center justify-center">
              <Wallet className="size-4 text-accent-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold">
                {isAddingWallet ? 'Nova Carteira' : 'Suas Carteiras'}
              </h2>
              <p className="text-xs text-neutral-500">
                {isAddingWallet ? 'Endereço Liquid (DePix)' : 'Selecione a carteira padrão'}
              </p>
            </div>
          </div>

          {isAddingWallet ? (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-500">Nome da carteira</label>
                  <Input
                    type="text"
                    placeholder="Ex: Carteira Principal"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-500">Endereço Liquid</label>
                  <Input
                    type="text"
                    placeholder="lq1qq... ou ex1..."
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-600">
                    Endereços Liquid começam com lq1 ou ex1
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setIsAddingWallet(false)} className="flex-1">
                  Voltar
                </Button>
                <Button variant="solid" size="sm" onClick={handleAddWallet} className="flex-1">
                  Salvar
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Wallet list */}
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto -mx-1 px-1">
                {wallets.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <div className="size-10 rounded-full bg-neutral-800 flex items-center justify-center">
                      <Wallet className="size-5 text-neutral-500" />
                    </div>
                    <p className="text-sm text-neutral-500">Nenhuma carteira</p>
                    <p className="text-xs text-neutral-600">Adicione uma carteira para receber</p>
                  </div>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => {
                        setDefaultWallet(wallet.id);
                        setShowWalletModal(false);
                      }}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left group',
                        wallet.isDefault
                          ? 'border-accent bg-accent-900/15'
                          : 'border-transparent hover:bg-neutral-800/50'
                      )}
                    >
                      <div className={cn(
                        'size-7 rounded-md flex items-center justify-center shrink-0',
                        wallet.isDefault ? 'bg-accent-900/30' : 'bg-neutral-800'
                      )}>
                        <Wallet className={cn('size-3.5', wallet.isDefault ? 'text-accent-300' : 'text-neutral-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{wallet.label}</p>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">
                          {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
                        </p>
                      </div>
                      {wallet.isDefault && (
                        <span className="text-[10px] text-accent-300 bg-accent-900/30 px-1.5 py-0.5 rounded">
                          Padrão
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>

              <Button variant="secondary" size="sm" onClick={() => setIsAddingWallet(true)} fullWidth>
                <Plus className="size-3.5" />
                Adicionar carteira
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Modal: CPF Confirmation */}
      <Modal
        open={showCpfConfirmModal}
        onClose={() => setShowCpfConfirmModal(false)}
      >
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="size-10 rounded-lg bg-accent-900/30 border border-accent-700/50 flex items-center justify-center">
              <User className="size-5 text-accent-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Confirmar documento</h2>
              <p className="text-xs text-neutral-500">Verifique o CPF/CNPJ do pagador</p>
            </div>
          </div>

          {/* Document Display */}
          <div className="p-4 rounded-xl bg-neutral-800/50 border border-border text-center">
            <p className="text-2xl font-mono font-semibold text-foreground tracking-wider">
              {watch('payerDocument')}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-900/15 border border-amber-800/30">
            <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              O PIX deve ser pago por uma conta bancária vinculada a este CPF/CNPJ. Pagamentos de outras contas serão estornados automaticamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCpfConfirmModal(false)}
              className="flex-1"
            >
              Corrigir
            </Button>
            <Button
              variant="solid"
              size="sm"
              onClick={handleConfirmCpf}
              className="flex-1"
            >
              <Check className="size-4" />
              Está correto
            </Button>
          </div>
        </div>
      </Modal>

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
