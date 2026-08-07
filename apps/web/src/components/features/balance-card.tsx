'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BalanceDisplay, Sparkline } from '@/components/ui/nocturne';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  available: number;
  reserved?: number;
  blocked?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  trend?: {
    data: number[];
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
}

export function BalanceCard({
  available,
  isLoading,
  trend,
}: BalanceCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="flex flex-col gap-2 py-1.5">
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-neutral-500">Saldo disponível</span>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          {isVisible ? (
            <Eye className="size-[13px]" />
          ) : (
            <EyeOff className="size-[13px]" />
          )}
        </button>
      </div>

      {/* Value */}
      {isLoading ? (
        <Skeleton className="h-[42px] w-48" />
      ) : isVisible ? (
        <BalanceDisplay value={available} size="default" />
      ) : (
        <div className="flex items-baseline gap-2 tabular-nums font-medium tracking-tight leading-none">
          <span className="text-[16px] text-neutral-500">R$</span>
          <span className="text-[42px]">••••••</span>
        </div>
      )}

      {/* Trend */}
      {trend && isVisible && (
        <div className="flex items-center gap-2.5 mt-1">
          <Sparkline
            data={trend.data}
            trend={trend.direction}
            width={72}
            height={20}
          />
          <span className={cn(
            "text-[11.5px]",
            trend.direction === 'up' && "text-accent-300",
            trend.direction === 'down' && "text-neutral-500",
            trend.direction === 'neutral' && "text-neutral-400"
          )}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
