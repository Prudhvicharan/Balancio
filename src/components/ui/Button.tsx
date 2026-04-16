import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-40 disabled:pointer-events-none active:scale-95';

    const variants = {
      primary:
        'bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] shadow-[0_0_20px_var(--accent-dim)]',
      secondary:
        'bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent-light)]',
      ghost:
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]',
      danger:
        'bg-[var(--red-dim)] text-[var(--red)] border border-[color-mix(in_srgb,var(--red)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--red)_20%,transparent)]',
      success:
        'bg-[var(--green-dim)] text-[var(--green)] border border-[color-mix(in_srgb,var(--green)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--green)_20%,transparent)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)] gap-1.5',
      md: 'px-4 py-2.5 text-sm rounded-[var(--radius)] gap-2',
      lg: 'px-6 py-3 text-base rounded-[var(--radius)] gap-2',
      icon: 'w-9 h-9 rounded-[var(--radius-sm)]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {size !== 'icon' && <span>Loading...</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
