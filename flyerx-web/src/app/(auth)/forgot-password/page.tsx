'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, Mail, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlowOrb } from '@/components/ui/nocturne';

import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
      setSentEmail(data.email);
      toast.success('Email enviado com sucesso!');
    } catch {
      // Não mostrar se o email existe ou não por segurança
      setEmailSent(true);
      setSentEmail(data.email);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
          {/* Header */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 flex items-center justify-center glow-accent">
              <Mail className="size-8 text-primary" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-[24px] font-medium tracking-[-0.02em]">
                Verifique seu email
              </h1>
              <p className="text-[13.5px] text-neutral-500 leading-relaxed max-w-[320px]">
                Enviamos um link de recuperação para{' '}
                <span className="text-neutral-300">{sentEmail}</span>
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-[--radius-xl] border border-divider bg-surface/50 p-4 mb-6">
            <p className="text-[13px] text-neutral-400 text-center leading-relaxed">
              Se você não receber o email em alguns minutos, verifique sua pasta de spam
              ou tente novamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => setEmailSent(false)}
              className="h-12"
            >
              Tentar outro email
            </Button>

            <Link href="/login" className="w-full">
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                className="h-12 text-neutral-400 hover:text-neutral-300"
              >
                <ChevronLeft className="size-4" />
                Voltar para o login
              </Button>
            </Link>
          </div>

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
        {/* Header */}
        <div className="flex flex-col gap-[14px] mb-8">
          <div className="w-[52px] h-[52px] rounded-[14px] border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent flex items-center justify-center text-[20px] font-semibold glow-accent">
            <span>f</span>
            <span className="text-primary">x</span>
          </div>

          <div className="flex flex-col gap-[6px]">
            <h1 className="text-[28px] font-medium tracking-[-0.02em] leading-[1.15]">
              Esqueceu sua senha?
            </h1>
            <p className="text-[13.5px] text-neutral-500 leading-[1.5]">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-neutral-500">Email</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-[12px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
            className="h-12 text-[15px] mt-2"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Enviar link de recuperação
          </Button>

          {/* Link para login */}
          <Link href="/login" className="w-full">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              fullWidth
              className="h-12 text-neutral-400 hover:text-neutral-300"
            >
              <ChevronLeft className="size-4" />
              Voltar para o login
            </Button>
          </Link>
        </form>

        {/* Footer de segurança */}
        <div className="flex items-center justify-center gap-[6px] text-[10.5px] text-neutral-600 mt-8">
          <Shield className="size-[11px]" />
          <span>Seus dados estão protegidos com criptografia</span>
        </div>
      </div>
    </div>
  );
}
