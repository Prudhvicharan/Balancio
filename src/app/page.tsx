'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, LayoutDashboard, UserCircle, ArrowUpAZ, Wallet, ArrowRight, ShieldCheck, Zap, Cloud } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { computeFriendStats, computeDashboardStats } from '@/lib/utils';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { FriendCard } from '@/components/dashboard/FriendCard';
import { FriendModal } from '@/components/friends/FriendModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function DashboardPage() {
  const { friends, transactions, user, authLoaded } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance'>('name');

  const friendsWithStats = useMemo(
    () =>
      friends
        .map((f) => computeFriendStats(f, transactions))
        .sort((a, b) =>
          sortBy === 'name'
            ? a.name.localeCompare(b.name)
            : b.balance - a.balance || a.name.localeCompare(b.name)
        ),
    [friends, transactions, sortBy]
  );

  const filtered = useMemo(
    () =>
      friendsWithStats.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
      ),
    [friendsWithStats, search]
  );

  const stats = useMemo(
    () => computeDashboardStats(friends, transactions),
    [friends, transactions]
  );

  const hasData = friends.length > 0;

  // ── Auth Gates ────────────────────────────────────────────────────────────

  if (!authLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border-light)] px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="Balancio Icon" className="w-9 h-9 rounded-xl shadow-sm" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">Balancio</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Smart debt tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <UserCircle className="w-5 h-5" />
            </Link>
            <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {hasData && (
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        )}
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-4 pb-safe space-y-4">
        {hasData ? (
          <>
            <StatsCards stats={stats} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                  Contacts ({filtered.length})
                </h2>
                <div className="flex items-center gap-2">
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-[var(--accent-light)] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setSortBy(sortBy === 'name' ? 'balance' : 'name')}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--bg-card-hover)]"
                  >
                    {sortBy === 'name' ? (
                      <><ArrowUpAZ className="w-3.5 h-3.5" /> A–Z</>
                    ) : (
                      <><Wallet className="w-3.5 h-3.5" /> Balance</>
                    )}
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  No contacts match &quot;{search}&quot;
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((f) => (
                    <FriendCard key={f.id} friend={f} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20 space-y-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,106,247,0.2), rgba(52,211,153,0.1))',
                border: '1px solid rgba(124,106,247,0.3)',
              }}
            >
              <LayoutDashboard className="w-9 h-9 text-[var(--accent-light)]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">No contacts yet</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                Add your first contact to start tracking money you&apos;ve lent.
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={() => setAddOpen(true)}>
              <Plus className="w-5 h-5" />
              Add First Contact
            </Button>
          </div>
        )}
      </main>

      <FriendModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page for Unauthenticated Users
// ─────────────────────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col pt-12 pb-8 px-6 relative overflow-hidden bg-[var(--bg)] z-0">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[rgba(124,106,247,0.15)] blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[rgba(52,211,153,0.1)] blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="flex justify-between items-center z-10 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <img 
            src="/apple-touch-icon.png" 
            alt="Balancio Icon" 
            className="w-8 h-8 rounded-xl shadow-[0_0_15px_rgba(124,106,247,0.4)]" 
          />
          <span className="font-bold text-xl text-[var(--text-primary)] tracking-tight">Balancio</span>
        </div>
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="font-medium text-[var(--accent-light)] hover:text-[var(--accent)]">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center text-center mt-12 mb-8 z-10 max-w-sm mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Cloud Synchronized</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
          Never lose <br /> track of a <br /> <span className="gradient-text">single cent.</span>
        </h1>
        
        <p className="text-base text-[var(--text-secondary)] mb-10 max-w-xs leading-relaxed">
          The elegant, zero-friction way to track debts, IOUs, and shared expenses among your friends.
        </p>

        <Link href="/settings" className="w-full">
          <Button variant="primary" size="lg" className="w-full h-14 text-base font-semibold shadow-[0_4px_20px_rgba(124,106,247,0.3)] transition-all hover:scale-[1.02]">
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-4 w-full mt-12 text-left">
          <div className="glass p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
            <Cloud className="w-6 h-6 text-[var(--accent-light)] mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Backup forever</h3>
            <p className="text-xs text-[var(--text-muted)]">Data safely tied to your account.</p>
          </div>
          <div className="glass p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--green)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity" />
            <ShieldCheck className="w-6 h-6 text-[var(--green)] mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Private & Secure</h3>
            <p className="text-xs text-[var(--text-muted)]">Nobody else sees your ledger.</p>
          </div>
          <div className="glass p-4 rounded-2xl relative overflow-hidden group col-span-2">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(124,106,247,0.2)] to-[rgba(52,211,153,0.1)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Hyper-fast interactions</h3>
                <p className="text-xs text-[var(--text-muted)]">Built specifically to feel like a native app on any device you use.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
