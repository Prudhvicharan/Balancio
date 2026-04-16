import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'red' | 'amber' | 'accent' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border)]',
    green: 'bg-[var(--green-dim)] text-[var(--green)]',
    red: 'bg-[var(--red-dim)] text-[var(--red)]',
    amber: 'bg-[var(--amber-dim)] text-[var(--amber)]',
    accent: 'bg-[var(--accent-dim)] text-[var(--accent-light)]',
    muted: 'bg-[var(--bg-input)] text-[var(--text-muted)]',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-full font-medium',
    md: 'text-sm px-3 py-1 rounded-full font-medium',
  };

  return (
    <span className={cn('inline-flex items-center gap-1', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
