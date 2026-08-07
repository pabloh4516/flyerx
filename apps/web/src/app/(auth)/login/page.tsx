'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Fingerprint, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui';
import { Logo, GlowOrb } from '@/components/ui/nocturne';

import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { login, verifyTwoFactor } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth';
import { useRedirectIfAuthenticated } from '@/hooks/use-auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated(returnUrl);
  const setUser = useAuthStore((state) => state.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'password' | '2fa'>('email');
  const [email, setEmail] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleEmailContinue = () => {
    if (!email || !email.includes('@')) {
      toast.error('Digite um email válido');
      return;
    }
    setValue('email', email);
    setStep('password');
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await login(data);

      if (response.requiresTwoFactor && response.twoFactorToken) {
        setStep('2fa');
        setTwoFactorToken(response.twoFactorToken);
        toast.info('Digite o código de autenticação');
      } else if (response.user) {
        setUser(response.user);
        toast.success('Login realizado com sucesso!');
        router.push(returnUrl);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao fazer login. Verifique suas credenciais.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error('O código deve ter 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyTwoFactor({
        twoFactorToken,
        code: twoFactorCode,
      });

      if (response.user) {
        setUser(response.user);
        toast.success('Login realizado com sucesso!');
        router.push(returnUrl);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Código inválido';
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
        className="top-[-180px] right-[-120px] opacity-60"
      />
      <GlowOrb
        variant="accent"
        size={460}
        className="bottom-[-220px] left-[-140px] opacity-70"
      />

      <Container size="sm" padded={false} className="relative z-10">
        {/* Logo e Título */}
        <div className="flex flex-col gap-3.5 mb-8">
          <div className="size-14 rounded-lg border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent flex items-center justify-center text-xl font-semibold glow-accent">
            <span>f</span>
            <span className="text-primary">x</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-medium tracking-[-0.02em] leading-[1.15]">
              Seu dinheiro,
              <br />
              na velocidade do PIX.
            </h1>
            <p className="text-sm text-neutral-500 leading-[1.5]">
              Carteira digital em reais com depósitos e saques instantâneos.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex flex-col gap-4">
          {step === 'email' && (
            <>
              {/* Campo de Email */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">E-mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoFocus
                />
              </div>

              <Button
                variant="solid"
                size="lg"
                fullWidth
                onClick={handleEmailContinue}
                className="h-12 text-base"
              >
                Continuar
              </Button>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="h-12 text-sm gap-2"
              >
                <Fingerprint className="size-4" />
                Entrar com biometria
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                <span className="text-xs text-neutral-600">novo por aqui?</span>
                <span className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
              </div>

              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full h-9 px-4 text-sm font-medium text-primary border border-transparent rounded-md bg-transparent hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] transition-all"
              >
                Abrir minha conta em minutos
              </Link>
            </>
          )}

          {step === 'password' && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Email (readonly) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-500">E-mail</label>
                <div
                  className="flex items-center h-10 px-3 rounded-lg border bg-card cursor-pointer hover:border-neutral-600 transition-colors"
                  onClick={() => setStep('email')}
                >
                  <span className="text-sm">{email}</span>
                </div>
              </div>

              <input type="hidden" {...register('email')} />

              {/* Senha */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-500">Senha</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu?
                  </Link>
                </div>
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
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="solid"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="h-12 text-base"
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Entrar
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => setStep('email')}
              >
                Voltar
              </Button>
            </form>
          )}

          {step === '2fa' && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-medium mb-1">Autenticação em duas etapas</h2>
                <p className="text-sm text-neutral-500">
                  Digite o código do seu aplicativo autenticador
                </p>
              </div>

              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[0.3em] font-medium"
                autoFocus
              />

              <Button
                variant="solid"
                size="lg"
                fullWidth
                onClick={handleVerify2FA}
                disabled={isLoading || twoFactorCode.length !== 6}
                className="h-12 text-base"
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Verificar
              </Button>

              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setStep('password');
                  setTwoFactorCode('');
                  setTwoFactorToken('');
                }}
              >
                Voltar
              </Button>
            </div>
          )}
        </div>

        {/* Footer de segurança */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-600 mt-8">
          <Shield className="size-3" />
          <span>Protegido com 2FA e criptografia de ponta a ponta</span>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
