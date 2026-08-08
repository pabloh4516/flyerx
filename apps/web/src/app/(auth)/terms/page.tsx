'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Container size="md">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 mb-6"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>

        <h1 className="text-2xl font-medium mb-6">Termos de Uso</h1>

        <div className="prose prose-invert prose-neutral max-w-none">
          <p className="text-neutral-400">
            Os termos de uso completos estarão disponíveis em breve.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">1. Aceitação dos Termos</h2>
          <p className="text-neutral-400">
            Ao criar uma conta e utilizar os serviços da Flyerx, você concorda com estes termos.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">2. Uso do Serviço</h2>
          <p className="text-neutral-400">
            A Flyerx oferece serviços de carteira digital e operações financeiras via PIX.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">3. Responsabilidades</h2>
          <p className="text-neutral-400">
            O usuário é responsável pela segurança de sua conta e credenciais de acesso.
          </p>
        </div>
      </Container>
    </div>
  );
}
