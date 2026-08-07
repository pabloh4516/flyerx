'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Shield, ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Container } from '@/components/ui';
import { GlowOrb } from '@/components/ui/nocturne';

import { registerSchema, RegisterFormData } from '@/lib/validations/auth';
import { register as apiRegister } from '@/lib/api/auth';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

// Máscaras de documento
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      documentType: 'CPF',
      acceptTerms: false,
    },
  });

  const documentType = watch('documentType');

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = documentType === 'CPF' ? formatCPF(value) : formatCNPJ(value);
    setValue('document', formatted, { shouldValidate: true });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  const handleStep1Continue = async () => {
    const isValid = await trigger(['name', 'email', 'document', 'documentType', 'phone']);
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await apiRegister({
        email: data.email,
        password: data.password,
        name: data.name,
        document: data.document.replace(/\D/g, ''),
        documentType: data.documentType,
        phone: data.phone?.replace(/\D/g, ''),
      });

      toast.success('Conta criada com sucesso! Verifique seu email.');
      router.push('/login');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao criar conta. Tente novamente.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Glow orbs de fundo */}
      <GlowOrb
        variant="section"
        size={480}
        className="top-[-180px] left-[-120px] opacity-60"
      />
      <GlowOrb
        variant="accent"
        size={460}
        className="bottom-[-220px] right-[-140px] opacity-70"
      />

      <Container size="sm" padded={false} className="relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-3.5 mb-8">
          <div className="size-14 rounded-lg border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent flex items-center justify-center text-xl font-semibold glow-accent">
            <span>f</span>
            <span className="text-primary">x</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-medium tracking-[-0.02em] leading-[1.15]">
              Crie sua conta
            </h1>
            <p className="text-sm text-neutral-500 leading-[1.5]">
              {step === 1 ? 'Preencha seus dados pessoais' : 'Defina sua senha de acesso'}
            </p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mt-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-neutral-800'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-neutral-800'}`} />
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              {/* Nome */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">Nome completo</label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  {...register('name')}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Tipo de documento e documento */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-neutral-500">Tipo</label>
                  <Select
                    value={documentType}
                    onValueChange={(value) => {
                      if (value === 'CPF' || value === 'CNPJ') {
                        setValue('documentType', value);
                        setValue('document', '');
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-xs text-neutral-500">
                    {documentType === 'CPF' ? 'CPF' : 'CNPJ'}
                  </label>
                  <Input
                    type="text"
                    placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    {...register('document')}
                    onChange={handleDocumentChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              {errors.document && (
                <p className="text-xs text-destructive -mt-2">{errors.document.message}</p>
              )}

              {/* Telefone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">Telefone (opcional)</label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  {...register('phone')}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <Button
                type="button"
                variant="solid"
                size="lg"
                fullWidth
                onClick={handleStep1Continue}
                className="h-12 text-base mt-2"
              >
                Continuar
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Voltar */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 mb-2 w-fit"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </button>

              {/* Senha */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">Confirmar senha</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Termos */}
              <Checkbox
                checked={watch('acceptTerms')}
                onChange={(e) => setValue('acceptTerms', e.target.checked)}
                disabled={isLoading}
                className="mt-2"
                label={
                  <span className="text-xs text-neutral-400 leading-relaxed">
                    Li e aceito os{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Política de Privacidade
                    </Link>
                  </span>
                }
              />
              {errors.acceptTerms && (
                <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
              )}

              <Button
                type="submit"
                variant="solid"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="h-12 text-base mt-2"
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Criar conta
              </Button>
            </>
          )}

          {/* Link para login */}
          <p className="text-sm text-center text-neutral-500 mt-2">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entre aqui
            </Link>
          </p>
        </form>

        {/* Footer de segurança */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-600 mt-8">
          <Shield className="size-3" />
          <span>Seus dados estão protegidos com criptografia</span>
        </div>
      </Container>
    </div>
  );
}
