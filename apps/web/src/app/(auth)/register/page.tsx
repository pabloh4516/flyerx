'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui';
import { Container } from '@/components/ui';
import { GlowOrb } from '@/components/ui/nocturne';

import { registerSchema, RegisterFormData } from '@/lib/validations/auth';
import { register as apiRegister } from '@/lib/api/auth';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await apiRegister({
        email: data.email,
        password: data.password,
        full_name: data.name,
        phone: data.phone?.replace(/\D/g, ''),
        accept_terms: data.acceptTerms,
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
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
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

      <Container size="sm" padded={false} className="relative z-10 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3.5 mb-6 sm:mb-8">
          <div className="size-12 sm:size-14 rounded-lg border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent flex items-center justify-center text-lg sm:text-xl font-semibold glow-accent">
            <span>f</span>
            <span className="text-primary">x</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl sm:text-2xl font-medium tracking-[-0.02em] leading-[1.15]">
              Crie sua conta
            </h1>
            <p className="text-sm text-neutral-500 leading-[1.5]">
              Preencha seus dados para começar
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

          {/* Senha */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
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
                placeholder="Repita a senha"
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

          {/* Link para login */}
          <p className="text-sm text-center text-neutral-500 mt-2">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entre aqui
            </Link>
          </p>
        </form>

        {/* Footer de segurança */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-600 mt-6 sm:mt-8">
          <Shield className="size-3" />
          <span>Seus dados estão protegidos com criptografia</span>
        </div>
      </Container>
    </div>
  );
}
