'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, QrCode, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/history', label: 'Extrato', icon: Receipt },
  { href: '/pix', label: 'Pix', icon: QrCode },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)] backdrop-blur-[10px] md:hidden">
      <div className="flex py-3 pb-[max(12px,env(safe-area-inset-bottom))] px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href !== '/dashboard' && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-accent-300" : "text-neutral-500"
              )}
            >
              <tab.icon className="size-5" />
              <span className={cn(
                "text-[10px]",
                isActive && "font-medium"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
