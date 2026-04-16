'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { computeFriendStats, formatCurrency, formatDate, generateReportText, PAYMENT_METHOD_ICONS, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReportPage({ params }: PageProps) {
  const { id } = use(params);
  const { friends, transactions } = useStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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

  const sortedTxns = [...stats.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const reportText = generateReportText(stats);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast('Report copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Balancio Report — ${friend.name}`,
          text: reportText,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const isSettled = stats.balance === 0 && stats.transactions.length > 0;
  const isOwedToYou = stats.balance > 0;

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border-light)] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/friends/${friend.id}`}
            className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-[var(--text-primary)]">Report</h1>
            <p className="text-xs text-[var(--text-muted)]">{friend.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-safe space-y-4">
        {/* Report card */}
        <div className="glass p-5 space-y-5">
          {/* Contact header */}
          <div className="flex items-center gap-4">
            <Avatar name={friend.name} size="lg" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{friend.name}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Generated {format(new Date(), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--border)]" />

          {/* Balance summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <TrendingUp className="w-4 h-4 text-[var(--red)]" />
                Total Lent
              </div>
              <p className="font-semibold text-[var(--red)] tabular-nums">
                {formatCurrency(stats.totalLent)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <TrendingDown className="w-4 h-4 text-[var(--green)]" />
                Total Received
              </div>
              <p className="font-semibold text-[var(--green)] tabular-nums">
                {formatCurrency(stats.totalReceived)}
              </p>
            </div>
            <div className="h-px bg-[var(--border)]" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {isSettled ? 'Fully Settled' : isOwedToYou ? 'Balance Owed' : 'You Owe'}
              </p>
              <p
                className={cn(
                  'text-lg font-bold tabular-nums',
                  isSettled
                    ? 'text-[var(--text-muted)]'
                    : isOwedToYou
                    ? 'text-[var(--red)]'
                    : 'text-[var(--green)]'
                )}
              >
                {formatCurrency(Math.abs(stats.balance))}
              </p>
            </div>
            {isSettled && (
              <Badge variant="green" size="md" className="w-full justify-center">
                ✓ Fully settled
              </Badge>
            )}
          </div>

          {/* Transaction history */}
          {sortedTxns.length > 0 && (
            <>
              <div className="h-px bg-[var(--border)]" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                    Transaction History ({sortedTxns.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {sortedTxns.map((t, i) => (
                    <div
                      key={t.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border',
                        t.type === 'lent'
                          ? 'bg-[var(--red-dim)] border-[color-mix(in_srgb,var(--red)_15%,transparent)]'
                          : 'bg-[var(--green-dim)] border-[color-mix(in_srgb,var(--green)_15%,transparent)]'
                      )}
                    >
                      <span className="text-base mt-0.5">{PAYMENT_METHOD_ICONS[t.paymentMethod]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              'font-semibold tabular-nums',
                              t.type === 'lent' ? 'text-[var(--red)]' : 'text-[var(--green)]'
                            )}
                          >
                            {t.type === 'lent' ? '+' : '−'}{formatCurrency(t.amount)}
                          </p>
                          <Badge variant={t.type === 'lent' ? 'red' : 'green'}>
                            {t.type === 'lent' ? 'Lent' : 'Received'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-[var(--text-muted)]">{formatDate(t.date)}</p>
                          <span className="text-[var(--text-muted)] text-xs">·</span>
                          <p className="text-xs text-[var(--text-muted)]">
                            {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                          </p>
                          {t.note && (
                            <>
                              <span className="text-[var(--text-muted)] text-xs">·</span>
                              <p className="text-xs text-[var(--text-secondary)] truncate">{t.note}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Raw text preview (for copy) */}
        <div className="glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Text Version
            </h3>
            <button
              onClick={handleCopy}
              className="text-xs text-[var(--accent-light)] hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <pre className="text-xs text-[var(--text-muted)] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {reportText}
          </pre>
        </div>

        {/* Share CTA */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy Text
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </main>
    </div>
  );
}
