'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="space-y-3">
      {/* Main balance card */}
      <div
        className="p-5 rounded-2xl border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,106,247,0.15) 0%, rgba(52,211,153,0.08) 100%)',
          borderColor: 'rgba(124,106,247,0.3)',
        }}
      >
        {/* Glow */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--accent)' }}
        />
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide font-medium mb-2">
          Total Outstanding
        </p>
        <p className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">
          {formatCurrency(stats.totalOutstanding)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {stats.activeDebtors} active debt{stats.activeDebtors !== 1 ? 's' : ''}
          {' · '}
          {stats.friendCount} contact{stats.friendCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lent / Received row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border bg-[var(--red-dim)] border-[color-mix(in_srgb,var(--red)_20%,transparent)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Total Lent</p>
            <div className="w-7 h-7 rounded-lg bg-[color-mix(in_srgb,var(--red)_20%,transparent)] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--red)]" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[var(--red)] tabular-nums">
            {formatCurrency(stats.totalLent)}
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-[var(--green-dim)] border-[color-mix(in_srgb,var(--green)_20%,transparent)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Received</p>
            <div className="w-7 h-7 rounded-lg bg-[color-mix(in_srgb,var(--green)_20%,transparent)] flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-[var(--green)]" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[var(--green)] tabular-nums">
            {formatCurrency(stats.totalReceived)}
          </p>
        </div>
      </div>
    </div>
  );
}
