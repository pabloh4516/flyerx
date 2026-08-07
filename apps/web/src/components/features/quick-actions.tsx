'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, QrCode, Receipt } from 'lucide-react';
import { ActionCircle } from '@/components/ui/nocturne';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary';
}

const actions: QuickAction[] = [
  {
    label: 'Depositar',
    href: '/deposit',
    icon: ArrowDown,
    variant: 'primary',
  },
  {
    label: 'Sacar',
    href: '/withdraw',
    icon: ArrowUp,
    variant: 'secondary',
  },
  {
    label: 'Pix copia e cola',
    href: '/pix',
    icon: QrCode,
    variant: 'secondary',
  },
  {
    label: 'Extrato',
    href: '/history',
    icon: Receipt,
    variant: 'secondary',
  },
];

export function QuickActions() {
  return (
    <div className="flex justify-between gap-3.5 py-0.5">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="flex-1">
          <ActionCircle
            variant={action.variant}
            label={action.label}
            className="w-full"
          >
            <action.icon className="size-5" />
          </ActionCircle>
        </Link>
      ))}
    </div>
  );
}
