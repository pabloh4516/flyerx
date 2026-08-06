'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Link2,
  Key,
  Users,
  Code,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GlowOrb, Logo } from '@/components/ui/nocturne';
import { useAuthStore } from '@/stores/auth';
import { useDailyLimit } from '@/hooks/use-queries';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/history', label: 'Extrato', icon: Receipt },
];

const moveNav: NavItem[] = [
  { href: '/receive', label: 'Receber PIX', icon: ArrowDownLeft },
  { href: '/send', label: 'Enviar PIX', icon: ArrowUpRight },
  { href: '/payment-links', label: 'Links de pagamento', icon: Link2 },
  { href: '/pix-keys', label: 'Chaves PIX', icon: Key, badge: 2 },
];

const platformNav: NavItem[] = [
  { href: '/subaccounts', label: 'Subcontas', icon: Users },
  { href: '/developers', label: 'Desenvolvedores', icon: Code },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: limitData } = useDailyLimit(user?.document ?? '', !!user?.document);

  const limitPercent = limitData
    ? Math.round((limitData.daily_volume_reais / limitData.daily_limit_reais) * 100)
    : 34;

  const limitUsed = limitData?.daily_volume_reais ?? 16900;
  const limitTotal = limitData?.daily_limit_reais ?? 50000;

  const userName = user?.name?.split(' ')[0] ?? 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
        isActive(item.href)
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-accent-200 border border-accent-800'
          : 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-900/50'
      )}
    >
      <item.icon className="size-3.5" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="tag tag-outline ml-auto text-[10px] px-1.5 py-0.5 whitespace-nowrap">
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-border bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)]">
        <Logo />

        {/* Search */}
        <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5 w-[300px] text-neutral-600">
          <Search className="size-3.5" />
          <span className="text-xs">Buscar transação, chave, link…</span>
          <span className="ml-auto text-[10px] border border-border rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </span>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <Link href="/receive">
            <Button variant="primary" size="sm" className="gap-2">
              <ArrowDown className="size-3.5" />
              Receber PIX
            </Button>
          </Link>

          {/* Notifications */}
          <button className="relative size-9 rounded-full border border-border flex items-center justify-center text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
            <Bell className="size-3.5" />
            <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--color-accent)]" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 border border-border rounded-full py-1 pl-1 pr-3 hover:border-neutral-700 transition-colors"
            >
              <div className="size-7 rounded-full bg-gradient-to-br from-accent-800 to-accent-900 border border-accent-700 text-accent-200 flex items-center justify-center text-xs font-medium">
                {userInitial}
              </div>
              <span className="text-xs">{userName}</span>
              <ChevronDown className="size-3 text-neutral-600" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  >
                    Configurações
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  >
                    <LogOut className="size-3.5" />
                    Sair da conta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-[220px] border-r border-border px-3 py-4 flex flex-col gap-0.5 bg-[color-mix(in_srgb,var(--color-surface)_35%,transparent)]">
          {/* Principal */}
          <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-600 px-2.5 pb-2">
            Principal
          </span>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Movimentar */}
          <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-600 px-2.5 pt-4 pb-2">
            Movimentar
          </span>
          {moveNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Plataforma */}
          <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-600 px-2.5 pt-4 pb-2">
            Plataforma
          </span>
          {platformNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Bottom section */}
          <div className="mt-auto flex flex-col gap-2">
            {/* Limit card */}
            <div className="border border-accent-800 rounded-md p-3 flex flex-col gap-2 bg-[linear-gradient(140deg,color-mix(in_srgb,var(--color-section)_40%,transparent),transparent_80%)]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Limite mensal</span>
                <span className="text-[10px] text-neutral-500 tabular-nums">
                  {limitPercent}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-neutral-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-600 to-accent-400"
                  style={{ width: `${limitPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-600 tabular-nums">
                R$ {limitUsed.toLocaleString('pt-BR')} de R${' '}
                {limitTotal.toLocaleString('pt-BR')} · Nível 2
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
            >
              <LogOut className="size-3.5" />
              Sair da conta
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 relative overflow-hidden">
          <GlowOrb
            variant="section"
            size={560}
            className="absolute -top-[180px] -right-[60px] opacity-30 pointer-events-none"
          />
          {children}
        </main>
      </div>
    </div>
  );
}
