'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, ArrowRight, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlowOrb } from '@/components/ui/nocturne';

import { verifyEmail } from '@/lib/api/auth';

type VerificationStatus = 'loading' | 'success' | 'error';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Token de verificação não encontrado');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        toast.success('Email verificado com sucesso!');
      } catch (error: unknown) {
        setStatus('error');
        const message =
          error instanceof Error
            ? error.message
            : 'O link de verificação é inválido ou expirou';
        setErrorMessage(message);
      }
    };

    verify();
  }, [token]);

  if (status === 'loading') {
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

        <div className="w-full max-w-[420px] relative z-10">
          <div className="flex flex-col items-center gap-6">
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 flex items-center justify-center">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-[24px] font-medium tracking-[-0.02em]">
                Verificando email...
              </h1>
              <p className="text-[13.5px] text-neutral-500 leading-relaxed">
                Aguarde enquanto verificamos seu email
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
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

        <div className="w-full max-w-[420px] relative z-10">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-destructive/20 to-transparent border border-destructive/30 flex items-center justify-center">
              <XCircle className="size-8 text-destructive" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-[24px] font-medium tracking-[-0.02em]">
                Falha na verificação
              </h1>
              <p className="text-[13.5px] text-neutral-500 leading-relaxed max-w-[320px]">
                {errorMessage}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-[--radius-xl] border border-divider bg-surface/50 p-4 mb-6">
            <p className="text-[13px] text-neutral-400 text-center leading-relaxed">
              O link de verificação pode ter expirado. Faça login para solicitar
              um novo link de verificação.
            </p>
          </div>

          {/* Actions */}
          <Link href="/login" className="block">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="h-12 text-[15px]"
            >
              Ir para o login
              <ArrowRight className="size-4" />
            </Button>
          </Link>

          {/* Footer de segurança */}
          <div className="flex items-center justify-center gap-[6px] text-[10.5px] text-neutral-600 mt-8">
            <Shield className="size-[11px]" />
            <span>Seus dados estão protegidos com criptografia</span>
          </div>
        </div>
      </div>
    );
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

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 flex items-center justify-center glow-accent">
            <CheckCircle className="size-8 text-green-500" />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-[24px] font-medium tracking-[-0.02em]">
              Email verificado!
            </h1>
            <p className="text-[13.5px] text-neutral-500 leading-relaxed max-w-[320px]">
              Seu email foi verificado com sucesso. Agora você pode acessar sua conta.
            </p>
          </div>
        </div>

        {/* Actions */}
        <Link href="/login" className="block">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="h-12 text-[15px]"
          >
            Continuar para o login
            <ArrowRight className="size-4" />
          </Button>
        </Link>

        {/* Footer de segurança */}
        <div className="flex items-center justify-center gap-[6px] text-[10.5px] text-neutral-600 mt-8">
          <Shield className="size-[11px]" />
          <span>Seus dados estão protegidos com criptografia</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
