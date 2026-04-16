import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const COLORS = [
  ['#7c6af7', '#4f3cc9'],
  ['#34d399', '#059669'],
  ['#f87171', '#dc2626'],
  ['#fbbf24', '#d97706'],
  ['#60a5fa', '#2563eb'],
  ['#f472b6', '#db2777'],
  ['#a78bfa', '#7c3aed'],
  ['#4ade80', '#16a34a'],
];

function nameToColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const [from, to] = COLORS[nameToColorIndex(name)];

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
        sizes[size],
        className
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
