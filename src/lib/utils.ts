import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { DashboardStats, Friend, FriendWithStats, PaymentMethod, Transaction } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function computeFriendStats(
  friend: Friend,
  transactions: Transaction[]
): FriendWithStats {
  const friendTxns = transactions.filter((t) => t.friendId === friend.id);
  const totalLent = friendTxns
    .filter((t) => t.type === 'lent')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = friendTxns
    .filter((t) => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const sorted = [...friendTxns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    ...friend,
    totalLent,
    totalReceived,
    balance: totalLent - totalReceived,
    transactions: sorted,
    lastActivity: sorted[0]?.date,
  };
}

export function computeDashboardStats(
  friends: Friend[],
  transactions: Transaction[]
): DashboardStats {
  let totalLent = 0;
  let totalReceived = 0;
  let activeDebtors = 0;

  for (const friend of friends) {
    const stats = computeFriendStats(friend, transactions);
    totalLent += stats.totalLent;
    totalReceived += stats.totalReceived;
    if (stats.balance > 0) activeDebtors++;
  }

  return {
    totalLent,
    totalReceived,
    totalOutstanding: totalLent - totalReceived,
    friendCount: friends.length,
    activeDebtors,
  };
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  venmo: 'Venmo',
  bank: 'Bank Transfer',
  amex: 'Amex',
  zelle: 'Zelle',
  paypal: 'PayPal',
  other: 'Other',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: '💵',
  venmo: '💙',
  bank: '🏦',
  amex: '💳',
  zelle: '⚡',
  paypal: '🅿️',
  other: '💸',
};

export function generateReportText(
  friend: FriendWithStats,
  includeTransactions = true
): string {
  const lines: string[] = [
    `Balancio Report — ${friend.name}`,
    `Generated: ${format(new Date(), 'MMM d, yyyy')}`,
    '',
    `Total Lent:     ${formatCurrency(friend.totalLent)}`,
    `Total Repaid:   ${formatCurrency(friend.totalReceived)}`,
    `Balance Owed:   ${formatCurrency(friend.balance)}`,
    '',
  ];

  if (includeTransactions && friend.transactions.length > 0) {
    lines.push('Transaction History:');
    lines.push('─'.repeat(40));
    for (const t of [...friend.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )) {
      const sign = t.type === 'lent' ? '↑' : '↓';
      const label = t.type === 'lent' ? 'Lent' : 'Received';
      const method = PAYMENT_METHOD_LABELS[t.paymentMethod];
      const note = t.note ? ` — ${t.note}` : '';
      lines.push(
        `${sign} ${formatDate(t.date)}  ${label.padEnd(8)} ${formatCurrency(t.amount).padStart(10)}  [${method}]${note}`
      );
    }
    lines.push('─'.repeat(40));
  }

  return lines.join('\n');
}
