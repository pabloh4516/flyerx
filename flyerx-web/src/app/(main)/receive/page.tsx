'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  QrCode,
  Check,
  Clock,
  Copy,
  RefreshCw,
  ExternalLink,
  Home,
  Loader2,
  Wallet,
  AlertTriangle,
  Plus,
} from 'lucide-react';

import { Button, Input, Container, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
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

// Validação de CPF
const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
};

// Validação de CNPJ
const isValidCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let remainder = sum % 11;
  if (remainder < 2) remainder = 0; else remainder = 11 - remainder;
  if (remainder !== parseInt(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  remainder = sum % 11;
  if (remainder < 2) remainder = 0; else remainder = 11 - remainder;
  return remainder === parseInt(digits[13]);
};

// Valida CPF ou CNPJ
const isValidDocument = (doc: string): boolean => {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) return isValidCPF(doc);
  if (digits.length === 14) return isValidCNPJ(doc);
  return false;
};

export default function SellerReceivePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { feeConfig, limits, wallets, getDefaultWallet, addWallet } = useFeesStore();

  const [step, setStep] = useState(1);
  const [deposit, setDeposit] = useState<DepositState | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [passFeeToCustomer, setPassFeeToCustomer] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentConfirmed, setDocumentConfirmed] = useState(false);
  const [pendingDocument, setPendingDocument] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');

  // Carteira selecionada ou padrão
  const selectedWallet = wallets.find(w => w.id === selectedWalletId) || getDefaultWallet();

  // Countdown timer
  useEffect(() => {
    if (!deposit?.expiration) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(deposit.expiration).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deposit?.expiration]);

  const formatTimeLeft = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
      amount: 0,
      payerDocument: '',
    },
  });

  const amount = watch('amount') || 0;
  const payerDocument = watch('payerDocument') || '';
  const isDocumentValid = isValidDocument(payerDocument);

  // Cálculo de taxas
  const fixedFee = feeConfig.deposit.eulenFixedFee + feeConfig.deposit.partnerFixedFee;
  const percentRate = feeConfig.deposit.partnerPercentFee;

  // Se repassar taxa: cliente paga mais, usuário recebe o valor cheio
  // Se absorver taxa: cliente paga o valor digitado, usuário recebe menos
  const { pixAmount, netAmount, totalFee } = passFeeToCustomer
    ? {
        // Fórmula: pixAmount = (amount + fixedFee) / (1 - percentRate)
        pixAmount: amount > 0 ? (amount + fixedFee) / (1 - percentRate) : 0,
        netAmount: amount,
        totalFee: amount > 0 ? ((amount + fixedFee) / (1 - percentRate)) - amount : 0,
      }
    : {
        pixAmount: amount,
        netAmount: amount > (fixedFee + amount * percentRate) ? amount - fixedFee - amount * percentRate : 0,
        totalFee: fixedFee + amount * percentRate,
      };

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

    // Se documento válido e ainda não confirmado, mostrar modal
    if (isValidDocument(formatted) && !documentConfirmed) {
      setPendingDocument(formatted);
      setShowDocumentModal(true);
    }

    // Se documento mudou, resetar confirmação
    if (documentConfirmed && formatted !== pendingDocument) {
      setDocumentConfirmed(false);
    }
  };

  const handleConfirmDocument = () => {
    setDocumentConfirmed(true);
    setShowDocumentModal(false);
    toast.success('CPF/CNPJ confirmado!');
  };

  const handleCancelDocument = () => {
    setShowDocumentModal(false);
    setValue('payerDocument', '');
    setPendingDocument('');
  };

  const handleAddWallet = () => {
    if (!newWalletLabel.trim() || !newWalletAddress.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Validação básica de endereço Liquid
    if (!newWalletAddress.startsWith('lq1') && !newWalletAddress.startsWith('ex1')) {
      toast.error('Endereço Liquid inválido');
      return;
    }

    addWallet({
      label: newWalletLabel.trim(),
      address: newWalletAddress.trim(),
      isDefault: wallets.length === 0,
    });

    toast.success('Carteira adicionada!');
    setShowWalletModal(false);
    setNewWalletLabel('');
    setNewWalletAddress('');
  };

  const handleAmountFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Remove zero inicial quando foca no input
    if (e.target.value === '0') {
      e.target.value = '';
      setValue('amount', 0);
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
    if (!selectedWallet) {
      toast.error('Configure uma carteira primeiro');
      return;
    }

    try {
      // Converte taxa percentual para formato da API (0.02 -> "2%")
      const splitFeeFormatted = `${feeConfig.deposit.partnerPercentFee * 100}%`;

      // Calcula o valor do PIX (considera se está repassando taxa)
      const amountForPix = passFeeToCustomer
        ? (data.amount + fixedFee) / (1 - percentRate)
        : data.amount;

      const result = await createDeposit.mutateAsync({
        amountReais: Math.round(amountForPix * 100) / 100, // Arredonda para 2 casas
        endUserTaxNumber: data.payerDocument.replace(/\D/g, ''),
        depixAddress: selectedWallet.address,
        // Parâmetros de split para comissão do parceiro
        depixSplitAddress: feeConfig.deposit.partnerDepixAddress,
        splitFee: splitFeeFormatted,
      });

      setDeposit({
        id: result.id,
        qrCopyPaste: result.qrCopyPaste,
        qrImageUrl: result.qrImageUrl,
        valueInCents: Math.round(amountForPix * 100),
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
    setValue('amount', 0);
    setValue('payerDocument', '');
  };

  // Formatar taxa para exibição
  const feeDisplay = `${(percentRate * 100).toFixed(0)}% + R$ ${fixedFee.toFixed(2).replace('.', ',')}`;

  return (
    <Container size="lg" padded={false} className="p-6 flex flex-col gap-6 min-h-full">
      {/* Step 1: Amount - CENTERED HERO LAYOUT */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-8">
          {/* Header Card */}
          <div className="w-full max-w-xl p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-accent-900/30 border border-accent-700/50 flex items-center justify-center">
                  <QrCode className="size-5 text-accent-300" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Receber PIX</h1>
                  <p className="text-xs text-neutral-500">Gere um QR Code para receber</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Taxa</p>
                <p className="text-sm font-medium text-primary">{feeDisplay}</p>
              </div>
            </div>
          </div>

          {/* HERO: Amount display */}
          <div className="flex flex-col items-center gap-4 py-6">
            <span className="text-sm text-neutral-500">Você vai receber</span>
            <div className="flex items-baseline gap-1">
              <span className="text-neutral-500 text-2xl">R$</span>
              <span className="text-6xl font-bold tabular-nums text-accent-200">
                {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {amount > 0 && (
              <p className="text-sm text-neutral-600">
                {passFeeToCustomer
                  ? `Taxa de ${formatCurrency(totalFee)} (paga pelo pagador)`
                  : `Taxa de ${formatCurrency(totalFee)}`
                }
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
                min={limits.deposit.min}
                max={limits.deposit.max}
                placeholder="0,00"
                className="flex-1 bg-transparent text-2xl font-semibold outline-none tabular-nums placeholder:text-neutral-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                {...register('amount', { valueAsNumber: true })}
                onFocus={handleAmountFocus}
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
                      ? 'bg-accent-800 text-accent-200 font-medium'
                      : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* CPF/CNPJ - inline */}
          <div className="w-full max-w-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">CPF/CNPJ do pagador</span>
              {isDocumentValid && documentConfirmed && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="size-3" />
                  Confirmado
                </span>
              )}
            </div>
            <Input
              type="text"
              placeholder="000.000.000-00"
              className={cn(
                "text-center text-lg",
                documentConfirmed && "border-green-600"
              )}
              {...register('payerDocument')}
              onChange={handleDocumentChange}
            />
            {!documentConfirmed && (
              <div className="flex items-center gap-2 justify-center text-xs text-amber-400">
                <AlertTriangle className="size-3" />
                <span>A conta PIX precisa ser do mesmo CPF/CNPJ</span>
              </div>
            )}
            {errors.payerDocument && (
              <p className="text-xs text-destructive text-center">{errors.payerDocument.message}</p>
            )}
          </div>

          {/* Options row */}
          <div className="w-full max-w-xl flex items-center justify-between gap-4 py-3 border-y border-border">
            <div className="flex items-center gap-3">
              <Switch
                checked={passFeeToCustomer}
                onChange={(e) => setPassFeeToCustomer(e.target.checked)}
              />
              <span className="text-sm text-neutral-400">Repassar taxa ao pagador</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-neutral-500" />
              {wallets.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowWalletModal(true)}
                  className="text-sm text-accent-400 hover:underline"
                >
                  Adicionar carteira
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedWallet?.id ?? ''}
                    onValueChange={(value) => setSelectedWalletId(value)}
                  >
                    <SelectTrigger className="w-auto border-0 bg-transparent p-0 h-auto text-sm text-neutral-300 gap-1">
                      <SelectValue>{selectedWallet?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="end">
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(true)}
                    className="size-6 rounded-md bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <Button
            type="submit"
            variant="solid"
            size="lg"
            className="w-full max-w-xl"
            disabled={createDeposit.isPending || !selectedWallet || !amount || !documentConfirmed}
          >
            {createDeposit.isPending && <Loader2 className="size-4 animate-spin" />}
            <QrCode className="size-4" />
            Gerar QR Code
          </Button>
        </form>
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
              <span className="text-xs text-neutral-500">
                Expira em <span className="text-white font-medium tabular-nums">{formatTimeLeft(timeLeft)}</span>
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

              <div className="bg-white rounded-lg p-4 shadow-md">
                {deposit.qrCopyPaste ? (
                  <QRCodeSVG
                    value={deposit.qrCopyPaste}
                    size={210}
                    level="M"
                    marginSize={0}
                  />
                ) : (
                  <div className="w-[210px] h-[210px] flex items-center justify-center bg-neutral-100 rounded">
                    <Logo size="lg" className="opacity-50" />
                  </div>
                )}
              </div>

              {/* Amount breakdown */}
              <div className="flex gap-2.5 justify-center">
                <div className="border border-border rounded-md px-4 py-2.5 flex flex-col gap-0.5 items-center">
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Bruto</span>
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(pixAmount)}</span>
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

      {/* Modal de confirmação CPF/CNPJ */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Overlay mais leve */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={handleCancelDocument}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header com ícone */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="size-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <AlertTriangle className="size-7 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-center">Confirme o documento</h2>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Documento */}
              <div className="text-center py-4 mb-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">CPF/CNPJ informado</p>
                <p className="text-2xl font-mono font-semibold tracking-wide">{pendingDocument}</p>
              </div>

              {/* Aviso */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-sm text-center text-neutral-300 leading-relaxed">
                  O pagamento <strong className="text-amber-300">precisa vir de uma conta PIX</strong> com este mesmo CPF/CNPJ.
                  Caso contrário, o valor será devolvido.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-border">
              <Button variant="ghost" className="flex-1" onClick={handleCancelDocument}>
                Corrigir
              </Button>
              <Button variant="solid" className="flex-1" onClick={handleConfirmDocument}>
                <Check className="size-4" />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nova carteira */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowWalletModal(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="size-14 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center mb-4">
                <Wallet className="size-7 text-accent-400" />
              </div>
              <h2 className="text-xl font-semibold text-center">Nova carteira</h2>
              <p className="text-sm text-neutral-500 mt-1">Adicione um endereço Liquid/DePix</p>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-500 uppercase tracking-wide">Nome</label>
                <Input
                  type="text"
                  placeholder="Ex: Minha carteira principal"
                  value={newWalletLabel}
                  onChange={(e) => setNewWalletLabel(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-500 uppercase tracking-wide">Endereço Liquid</label>
                <Input
                  type="text"
                  placeholder="lq1..."
                  className="font-mono text-sm"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                />
                <p className="text-xs text-neutral-600">Começa com lq1 ou ex1</p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <Button variant="ghost" className="flex-1" onClick={() => setShowWalletModal(false)}>
                Cancelar
              </Button>
              <Button variant="solid" className="flex-1" onClick={handleAddWallet}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
