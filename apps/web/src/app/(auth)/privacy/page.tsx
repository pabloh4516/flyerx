'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui';

export default function PrivacyPage() {
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

        <h1 className="text-2xl font-medium mb-6">Política de Privacidade</h1>

        <div className="prose prose-invert prose-neutral max-w-none">
          <p className="text-neutral-400">
            A política de privacidade completa estará disponível em breve.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">1. Dados Coletados</h2>
          <p className="text-neutral-400">
            Coletamos dados necessários para operação da conta: nome, email, telefone e documentos para KYC.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">2. Uso dos Dados</h2>
          <p className="text-neutral-400">
            Seus dados são utilizados exclusivamente para operação dos serviços e cumprimento de obrigações legais.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">3. Segurança</h2>
          <p className="text-neutral-400">
            Utilizamos criptografia e medidas de segurança para proteger seus dados.
          </p>

          <h2 className="text-lg font-medium mt-6 mb-3">4. Seus Direitos</h2>
          <p className="text-neutral-400">
            Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.
          </p>
        </div>
      </Container>
    </div>
  );
}
