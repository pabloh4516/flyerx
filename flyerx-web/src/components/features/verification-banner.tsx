'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProgressRing } from '@/components/ui/nocturne';
import type { KYCLevel } from '@/types';

interface VerificationBannerProps {
  kycLevel?: KYCLevel;
}

const kycConfig: Record<KYCLevel, { progress: number; title: string; description: string } | null> = {
  NONE: {
    progress: 0,
    title: 'Complete sua verificação',
    description: 'Verifique sua identidade para começar a usar sua conta',
  },
  BASIC: {
    progress: 33,
    title: 'Verificação Nível 1 concluída',
    description: 'Suba para Nível 2 e aumente seus limites',
  },
  VERIFIED: {
    progress: 66,
    title: 'Verificação Nível 2 em análise',
    description: 'Aprovando, seu limite mensal sobe para R$ 50.000',
  },
  FULL: null,
};

export function VerificationBanner({ kycLevel = 'NONE' }: VerificationBannerProps) {
  const config = kycConfig[kycLevel];

  if (!config) return null;

  return (
    <Link
      href="/settings/verification"
      className="flex items-center gap-3.5 p-3.5 rounded-[--radius-md] border border-accent-800 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--color-section)_55%,transparent),transparent_70%)] hover:border-accent-700 transition-colors"
    >
      <ProgressRing value={config.progress} size={40} strokeWidth={4} />

      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[13px] font-medium">{config.title}</span>
        <span className="text-[11.5px] text-neutral-500 leading-[1.45]">
          {config.description}
        </span>
      </div>

      <ChevronRight className="size-4 text-neutral-600 shrink-0" />
    </Link>
  );
}
