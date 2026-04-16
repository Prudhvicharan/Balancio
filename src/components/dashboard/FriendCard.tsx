'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import type { FriendWithStats } from '@/types';
import { cn } from '@/lib/utils';

interface FriendCardProps {
  friend: FriendWithStats;
}

export function FriendCard({ friend }: FriendCardProps) {
  const isSettled = friend.balance === 0;
  const isOwedToYou = friend.balance > 0;
  const isOwesThem = friend.balance < 0;

  return (
    <Link
      href={`/friends/${friend.id}`}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'bg-[var(--bg-card)] border-[var(--border)]',
        'hover:border-[var(--accent)] hover:bg-[var(--bg-card-hover)] hover:shadow-lg hover:shadow-[var(--accent-dim)]'
      )}
    >
      <Avatar name={friend.name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-[var(--text-primary)] truncate">{friend.name}</p>
          {isSettled && friend.transactions.length > 0 && (
            <Badge variant="muted">Settled</Badge>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {friend.transactions.length === 0
            ? 'No transactions yet'
            : friend.lastActivity
            ? `Last activity ${formatRelativeDate(friend.lastActivity)}`
            : ''}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          {friend.transactions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">—</p>
          ) : isSettled ? (
            <p className="text-sm font-medium text-[var(--text-muted)]">$0.00</p>
          ) : (
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                isOwedToYou ? 'text-[var(--red)]' : 'text-[var(--green)]'
              )}
            >
              {isOwedToYou ? '+' : '−'}{formatCurrency(Math.abs(friend.balance))}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            {isOwedToYou ? 'owes you' : isOwesThem ? 'you owe' : isSettled ? 'settled' : ''}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
      </div>
    </Link>
  );
}

