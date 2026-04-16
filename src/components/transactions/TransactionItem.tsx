'use client';

import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { useStore } from '@/stores/useStore';
import { useToast } from '@/components/ui/Toast';
import {
  formatCurrency,
  formatDate,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
} from '@/lib/utils';
import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { TransactionModal } from './TransactionModal';

interface TransactionItemProps {
  transaction: Transaction;
  friendId: string;
}

export function TransactionItem({ transaction: t, friendId }: TransactionItemProps) {
  const { deleteTransaction } = useStore();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isLent = t.type === 'lent';

  return (
    <>
      <div
        className={cn(
          'group relative flex items-start gap-3 p-3 rounded-xl border transition-all',
          isLent
            ? 'bg-[var(--red-dim)] border-[color-mix(in_srgb,var(--red)_15%,transparent)]'
            : 'bg-[var(--green-dim)] border-[color-mix(in_srgb,var(--green)_15%,transparent)]'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
            isLent
              ? 'bg-[color-mix(in_srgb,var(--red)_25%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--green)_25%,transparent)]'
          )}
        >
          {isLent ? (
            <ArrowUpRight className="w-4 h-4 text-[var(--red)]" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-[var(--green)]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'text-base font-semibold tabular-nums',
                isLent ? 'text-[var(--red)]' : 'text-[var(--green)]'
              )}
            >
              {isLent ? '+' : '−'}{formatCurrency(t.amount)}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm">{PAYMENT_METHOD_ICONS[t.paymentMethod]}</span>
              <Badge variant={isLent ? 'red' : 'green'}>
                {PAYMENT_METHOD_LABELS[t.paymentMethod]}
              </Badge>
              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={cn(
                    'p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors',
                    'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'
                  )}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-6 z-20 w-32 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                      <button
                        onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--red)] hover:bg-[var(--red-dim)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[var(--text-muted)]">{formatDate(t.date)}</p>
            {t.note && (
              <>
                <span className="text-[var(--text-muted)] text-xs">·</span>
                <p className="text-xs text-[var(--text-secondary)] truncate">{t.note}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <TransactionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        friendId={friendId}
        transaction={t}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteTransaction(t.id);
          toast('Transaction deleted');
          setDeleteOpen(false);
        }}
        title="Delete transaction?"
        description={`Remove ${formatCurrency(t.amount)} ${t.type === 'lent' ? 'lent' : 'received'} on ${formatDate(t.date)}?`}
        confirmLabel="Delete"
      />
    </>
  );
}
