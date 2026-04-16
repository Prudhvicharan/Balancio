'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  LogOut,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Download,
  CheckCircle,
  Cloud,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Send,
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  isSupabaseConfigured,
  supabase,
  signIn,
  signUp,
  signOut,
  getSession,
  pushToCloud,
  pullFromCloud,
  resetPasswordForEmail,
  resendConfirmation,
} from '@/lib/supabase';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEmailInitials(email: string): string {
  const [local] = email.split('@');
  return local.slice(0, 2).toUpperCase();
}

function AccountAvatar({ email }: { email: string }) {
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white select-none shrink-0"
      style={{
        background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--green)))',
        boxShadow: '0 0 30px var(--accent-dim)',
      }}
    >
      {getEmailInitials(email)}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 text-center p-3 bg-[var(--bg-input)] rounded-xl">
      <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

/** Inline form error — stays visible until resolved, unlike toasts */
function FormError({ message, onAction, actionLabel }: {
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--red-dim)] border border-[color-mix(in_srgb,var(--red)_25%,transparent)]">
      <AlertCircle className="w-4 h-4 text-[var(--red)] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--red)] leading-relaxed">{message}</p>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="text-xs font-semibold text-[var(--red)] underline underline-offset-2 mt-1"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth mode types
type AuthMode = 'signin' | 'signup' | 'forgot';

// "Screen" shown instead of the form
type FormScreen = 'form' | 'confirmSignup' | 'confirmReset';

// ─────────────────────────────────────────────────────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams();
  const { friends, transactions, replaceAll, user: authUser, authLoaded } = useStore();
  const { toast } = useToast();

  // Auth
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [formScreen, setFormScreen] = useState<FormScreen>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Sentinel from signIn so we can show "resend" action
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // ── URL error param ────────────────────────────────────────────────────────
  useEffect(() => {
    const err = searchParams.get('auth_error');
    if (err) setFormError(decodeURIComponent(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // ── Reset form errors when mode changes ───────────────────────────────────
  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setFormError(null);
    setEmailNotConfirmed(false);
  };

  // ── Manual sync ───────────────────────────────────────────────────────────
  const handleSyncNow = useCallback(async (userId?: string) => {
    const uid = userId ?? authUser?.id;
    if (!uid) return;
    setSyncing(true);
    try {
      const cloudData = await pullFromCloud(uid);
      if (cloudData) {
        const localFriendIds = new Set(friends.map((f) => f.id));
        const localTxnIds = new Set(transactions.map((t) => t.id));
        const cloudFriendIds = new Set(cloudData.friends.map((f) => f.id));
        const cloudTxnIds = new Set(cloudData.transactions.map((t) => t.id));

        const mergedFriends = [
          ...friends,
          ...cloudData.friends.filter((f) => !localFriendIds.has(f.id)),
        ];
        const mergedTxns = [
          ...transactions,
          ...cloudData.transactions.filter((t) => !localTxnIds.has(t.id)),
        ];
        replaceAll(mergedFriends, mergedTxns);

        const newFriends = mergedFriends.filter((f) => !cloudFriendIds.has(f.id));
        const newTxns = mergedTxns.filter((t) => !cloudTxnIds.has(t.id));
        if (newFriends.length > 0 || newTxns.length > 0) {
          await pushToCloud(newFriends, newTxns, uid);
        }
      } else {
        await pushToCloud(friends, transactions, uid);
      }
      const now = new Date().toISOString();
      setLastSynced(now);
      toast('All caught up!');
    } catch {
      toast('Sync failed — check your connection', 'error');
    } finally {
      setSyncing(false);
    }
  }, [friends, transactions, replaceAll]);

  // ── Sign In ────────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    setFormError(null);
    setEmailNotConfirmed(false);
    if (!email.trim() || !password) return;
    setAuthLoading(true);
    const { error } = await signIn(email.trim(), password);
    setAuthLoading(false);

    if (!error) {
      // onAuthStateChange in ClientProvider handles data loading.
      // Our local listener above updates authUser.
      return;
    }

    if (error === '__EMAIL_NOT_CONFIRMED__') {
      setEmailNotConfirmed(true);
      setFormError('Please confirm your email before signing in. Check your inbox.');
    } else {
      setFormError(error);
    }
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    setFormError(null);
    if (!email.trim() || !password) return;

    // Local validation
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    const { error, needsConfirmation, emailAlreadyExists } = await signUp(email.trim(), password);
    setAuthLoading(false);

    if (emailAlreadyExists) {
      // Don't throw an error — guide them to sign in instead.
      switchMode('signin');
      setFormError('An account with this email already exists. Please sign in.');
      return;
    }

    if (error) {
      setFormError(error);
      return;
    }

    if (needsConfirmation) {
      setFormScreen('confirmSignup');
    }
    // If no confirmation needed (email confirm disabled), ClientProvider handles sign-in.
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    setFormError(null);
    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    setAuthLoading(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setAuthLoading(false);

    if (error) {
      setFormError(error);
    } else {
      setFormScreen('confirmReset');
    }
  };

  // ── Resend confirmation ────────────────────────────────────────────────────
  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    const { error } = await resendConfirmation(email.trim());
    if (error) {
      toast(error, 'error');
    } else {
      toast('Confirmation email resent!');
    }
  };

  // ── Auth dispatch ──────────────────────────────────────────────────────────
  const handleAuth = () => {
    if (authMode === 'signin') return handleSignIn();
    if (authMode === 'signup') return handleSignUp();
    if (authMode === 'forgot') return handleForgotPassword();
  };

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    // ClientProvider.SIGNED_OUT clears local state.
    toast('Signed out');
  };


  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalOutstanding = friends.reduce((sum, f) => {
    const lent = transactions
      .filter((t) => t.friendId === f.id && t.type === 'lent')
      .reduce((s, t) => s + t.amount, 0);
    const recv = transactions
      .filter((t) => t.friendId === f.id && t.type === 'received')
      .reduce((s, t) => s + t.amount, 0);
    const bal = lent - recv;
    return bal > 0 ? sum + bal : sum;
  }, 0);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border-light)] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-[var(--text-primary)]">Account</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-safe space-y-4">

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {!authLoaded ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-[var(--accent-light)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

        ) : authUser ? (
          /* ──────────────────────────────────────────────────────────────────
             SIGNED-IN STATE
          ────────────────────────────────────────────────────────────────── */
          <>
            {/* Profile card */}
            <div
              className="p-5 rounded-2xl border relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,106,247,0.12) 0%, rgba(52,211,153,0.06) 100%)',
                borderColor: 'rgba(124,106,247,0.25)',
              }}
            >
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: 'var(--accent)' }}
              />
              <div className="flex items-center gap-4">
                <AccountAvatar email={authUser.email} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium mb-0.5">Signed in as</p>
                  <p className="font-semibold text-[var(--text-primary)] truncate">{authUser.email}</p>
                  {lastSynced ? (
                    <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] inline-block animate-pulse" />
                      Synced {format(new Date(lastSynced), 'MMM d, h:mm a')}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] mt-1">Not synced yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <StatPill label="Contacts" value={friends.length} />
                <StatPill label="Transactions" value={transactions.length} />
                <StatPill label="Outstanding" value={formatCurrency(totalOutstanding)} />
              </div>
            </div>

            {/* Cloud backup controls */}
            <div className="glass p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[var(--accent-light)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Cloud Backup</h2>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--green-dim)] text-[var(--green)] font-medium border border-[color-mix(in_srgb,var(--green)_25%,transparent)]">
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Your data automatically saves to the cloud. Sign in on any device to access it.
              </p>
              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" onClick={() => handleSyncNow()} loading={syncing}>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </Button>
                <Button variant="ghost" onClick={handleSignOut} disabled={syncing}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </>

        ) : formScreen === 'confirmSignup' ? (
          /* ── Confirm signup ── */
          <div className="space-y-4 pt-4">
            <div
              className="p-6 rounded-2xl border text-center space-y-3"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(52,211,153,0.04))',
                borderColor: 'rgba(52,211,153,0.25)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--green-dim)] border border-[color-mix(in_srgb,var(--green)_25%,transparent)] flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-[var(--green)]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--text-primary)]">Check your inbox</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  We sent a link to{' '}
                  <span className="text-[var(--green)] font-medium">{email}</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Click it to confirm your account, then come back and sign in.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handleResendConfirmation()}
              >
                <Send className="w-4 h-4" />
                Resend email
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { setFormScreen('form'); switchMode('signin'); }}
              >
                Back to Sign In
              </Button>
            </div>
          </div>

        ) : formScreen === 'confirmReset' ? (
          /* ── Confirm password reset ── */
          <div className="space-y-4 pt-4">
            <div
              className="p-6 rounded-2xl border text-center space-y-3"
              style={{
                background: 'linear-gradient(135deg, rgba(124,106,247,0.1), rgba(124,106,247,0.04))',
                borderColor: 'rgba(124,106,247,0.25)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-dim)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6 text-[var(--accent-light)]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--text-primary)]">Reset link sent</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Check <span className="text-[var(--accent-light)] font-medium">{email}</span> for a link to reset your password.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => { setFormScreen('form'); switchMode('signin'); }}
            >
              Back to Sign In
            </Button>
          </div>

        ) : (
          /* ──────────────────────────────────────────────────────────────────
             AUTH FORM (sign in / sign up / forgot password)
          ────────────────────────────────────────────────────────────────── */
          <div className="space-y-4">
            {/* Hero */}
            <div className="text-center pt-2 pb-1 space-y-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,106,247,0.2), rgba(52,211,153,0.1))',
                  border: '1px solid rgba(124,106,247,0.3)',
                }}
              >
                {authMode === 'forgot' ? (
                  <KeyRound className="w-6 h-6 text-[var(--accent-light)]" />
                ) : (
                  <Cloud className="w-6 h-6 text-[var(--accent-light)]" />
                )}
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {authMode === 'signin' && 'Welcome back'}
                {authMode === 'signup' && 'Create your account'}
                {authMode === 'forgot' && 'Reset your password'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {authMode === 'signin' && 'Sign in to access your data on this device.'}
                {authMode === 'signup' && 'Create an account and your data syncs everywhere automatically.'}
                {authMode === 'forgot' && "Enter your email and we'll send you a reset link."}
              </p>
            </div>

            {/* Form card */}
            <div className="glass p-5 space-y-3">
              {/* Mode toggle — only for signin/signup */}
              {authMode !== 'forgot' && (
                <div className="flex gap-1 p-1 bg-[var(--bg-input)] rounded-[var(--radius)]">
                  {(['signin', 'signup'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => switchMode(mode)}
                      className={cn(
                        'flex-1 py-2 rounded-[calc(var(--radius)-2px)] text-xs font-medium transition-all',
                        authMode === mode
                          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      )}
                    >
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>
              )}

              {/* Email */}
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                leftIcon={<Mail className="w-4 h-4" />}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />

              {/* Password — hidden in forgot mode */}
              {authMode !== 'forgot' && (
                <Input
                  label="Password"
                  type="password"
                  placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />
              )}

              {/* Inline error */}
              {formError && (
                <FormError
                  message={formError}
                  onAction={emailNotConfirmed ? handleResendConfirmation : undefined}
                  actionLabel={emailNotConfirmed ? 'Resend confirmation email' : undefined}
                />
              )}

              {/* CTA */}
              <Button
                variant="primary"
                className="w-full"
                onClick={handleAuth}
                loading={authLoading}
                disabled={
                  !email.trim() ||
                  (authMode !== 'forgot' && !password)
                }
              >
                {authMode === 'signin' && <><LogIn className="w-4 h-4" /> Sign In</>}
                {authMode === 'signup' && <><UserPlus className="w-4 h-4" /> Create Account</>}
                {authMode === 'forgot' && <><Send className="w-4 h-4" /> Send Reset Link</>}
              </Button>

              {/* Forgot password link — only on sign in */}
              {authMode === 'signin' && (
                <button
                  onClick={() => switchMode('forgot')}
                  className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-1"
                >
                  Forgot your password?
                </button>
              )}

              {/* Back — only on forgot */}
              {authMode === 'forgot' && (
                <button
                  onClick={() => switchMode('signin')}
                  className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-1 flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" /> Back to Sign In
                </button>
              )}
            </div>

            {/* Value props — only on signup */}
            {authMode === 'signup' && (
              <div className="space-y-2 px-1">
                {[
                  'Access your data on any device — phone, laptop, anywhere',
                  'Never lose your records — cloud-backed automatically',
                  'Switch devices anytime, data follows you instantly',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text-secondary)]">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
