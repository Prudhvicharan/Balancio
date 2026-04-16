'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  FileText,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { computeFriendStats, formatCurrency, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { FriendModal } from '@/components/friends/FriendModal';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { SmartParserModal } from '@/components/transactions/SmartParserModal';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FriendPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { friends, transactions, deleteFriend } = useStore();
  const { toast } = useToast();

  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [editFriendOpen, setEditFriendOpen] = useState(false);
  const [deleteFriendOpen, setDeleteFriendOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [defaultTxnType, setDefaultTxnType] = useState<'lent' | 'received'>('lent');
  const [filter, setFilter] = useState<'all' | 'lent' | 'received'>('all');

  const friend = useMemo(() => friends.find((f) => f.id === id), [friends, id]);

  const stats = useMemo(
    () => (friend ? computeFriendStats(friend, transactions) : null),
    [friend, transactions]
  );

  if (!friend || !stats) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[var(--text-secondary)]">Contact not found.</p>
        <Link href="/">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const filteredTxns = stats.transactions.filter(
    (t) => filter === 'all' || t.type === filter
  );

  const isSettled = stats.balance === 0 && stats.transactions.length > 0;
  const isOwedToYou = stats.balance > 0;

  const handleDeleteFriend = () => {
    deleteFriend(friend.id);
    toast(`${friend.name} removed`);
    router.push('/');
  };

  const openAddLent = () => {
    setDefaultTxnType('lent');
    setAddTxnOpen(true);
  };

  const openAddReceived = () => {
    setDefaultTxnType('received');
    setAddTxnOpen(true);
  };

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border-light)] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Avatar name={friend.name} size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[var(--text-primary)] truncate">{friend.name}</h1>
            {friend.notes && (
              <p className="text-xs text-[var(--text-muted)] truncate">{friend.notes}</p>
            )}
          </div>
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-40 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                  <Link
                    href={`/report/${friend.id}`}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4" /> View Report
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); setEditFriendOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Contact
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setDeleteFriendOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--red)] hover:bg-[var(--red-dim)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-safe space-y-4">
        {/* Balance summary */}
        <div
          className="p-5 rounded-2xl border relative overflow-hidden"
          style={{
            background: isSettled
              ? 'rgba(136,136,168,0.08)'
              : isOwedToYou
              ? 'var(--red-dim)'
              : 'var(--green-dim)',
            borderColor: isSettled
              ? 'var(--border)'
              : isOwedToYou
              ? 'color-mix(in srgb, var(--red) 25%, transparent)'
              : 'color-mix(in srgb, var(--green) 25%, transparent)',
          }}
        >
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium mb-1">
            {isSettled ? 'Fully Settled' : isOwedToYou ? 'Owes You' : 'You Owe'}
          </p>
          <p
            className={cn(
              'text-4xl font-bold tabular-nums',
              isSettled
                ? 'text-[var(--text-muted)]'
                : isOwedToYou
                ? 'text-[var(--red)]'
                : 'text-[var(--green)]'
            )}
          >
            {formatCurrency(Math.abs(stats.balance))}
          </p>

          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total Lent</p>
              <p className="text-sm font-medium text-[var(--red)]">{formatCurrency(stats.totalLent)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total Received</p>
              <p className="text-sm font-medium text-[var(--green)]">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Transactions</p>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{stats.transactions.length}</p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={openAddLent}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-[var(--red-dim)] border-[color-mix(in_srgb,var(--red)_20%,transparent)] hover:border-[var(--red)] transition-all active:scale-95"
          >
            <TrendingUp className="w-5 h-5 text-[var(--red)]" />
            <span className="text-xs font-medium text-[var(--red)]">Lent Money</span>
          </button>
          <button
            onClick={openAddReceived}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-[var(--green-dim)] border-[color-mix(in_srgb,var(--green)_20%,transparent)] hover:border-[var(--green)] transition-all active:scale-95"
          >
            <TrendingDown className="w-5 h-5 text-[var(--green)]" />
            <span className="text-xs font-medium text-[var(--green)]">Received</span>
          </button>
          <button
            onClick={() => setSmartOpen(true)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-[var(--accent-dim)] border-[color-mix(in_srgb,var(--accent)_20%,transparent)] hover:border-[var(--accent)] transition-all active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-[var(--accent-light)]" />
            <span className="text-xs font-medium text-[var(--accent-light)]">Smart Add</span>
          </button>
        </div>

        {/* Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Transactions
            </h2>
            {/* Filter tabs */}
            {stats.transactions.length > 0 && (
              <div className="flex gap-1 p-0.5 bg-[var(--bg-input)] rounded-lg">
                {(['all', 'lent', 'received'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-2 py-1 rounded-md text-xs font-medium capitalize transition-all',
                      filter === f
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredTxns.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mx-auto">
                <Minus className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {stats.transactions.length === 0
                  ? 'No transactions yet'
                  : `No ${filter} transactions`}
              </p>
              {stats.transactions.length === 0 && (
                <Button variant="secondary" size="sm" onClick={openAddLent}>
                  <Plus className="w-4 h-4" />
                  Add First Transaction
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTxns.map((t) => (
                <TransactionItem key={t.id} transaction={t} friendId={friend.id} />
              ))}
            </div>
          )}
        </div>

        {/* View report link */}
        {stats.transactions.length > 0 && (
          <Link href={`/report/${friend.id}`}>
            <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent-light)] hover:bg-[var(--accent-dim)] transition-all">
              <FileText className="w-4 h-4" />
              View Shareable Report
            </button>
          </Link>
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        open={addTxnOpen}
        onClose={() => setAddTxnOpen(false)}
        friendId={friend.id}
        defaultType={defaultTxnType}
      />
      <SmartParserModal
        open={smartOpen}
        onClose={() => setSmartOpen(false)}
        friendId={friend.id}
        friendName={friend.name}
      />
      <FriendModal
        open={editFriendOpen}
        onClose={() => setEditFriendOpen(false)}
        friend={friend}
      />
      <ConfirmModal
        open={deleteFriendOpen}
        onClose={() => setDeleteFriendOpen(false)}
        onConfirm={handleDeleteFriend}
        title={`Delete ${friend.name}?`}
        description="This will permanently delete all transactions too."
        confirmLabel="Delete Everything"
      />
    </div>
  );
}
