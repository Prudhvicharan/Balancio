import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Friend, Transaction } from '@/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Returns null when env vars are not configured — app works without Supabase
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = !!supabase;

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Maps Supabase's terse/vague error strings to user-friendly copy.
 * Also handles the free-tier email rate limit which trips up during testing.
 */
function mapSupabaseError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit')) {
    return 'Too many emails sent in a short time. Please wait a few minutes and try again.';
  }
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (m.includes('email not confirmed')) {
    return '__EMAIL_NOT_CONFIRMED__'; // sentinel — UI handles this specifically
  }
  if (m.includes('user already registered') || m.includes('already exists')) {
    return 'An account with this email already exists. Please sign in.';
  }
  if (m.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (m.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }
  return message; // fallback — show as-is
}


export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? mapSupabaseError(error.message) : null };
}

export async function signUp(
  email: string,
  password: string
): Promise<{ error: string | null; needsConfirmation: boolean; emailAlreadyExists: boolean }> {
  if (!supabase) {
    return { error: 'Supabase not configured', needsConfirmation: false, emailAlreadyExists: false };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: mapSupabaseError(error.message), needsConfirmation: false, emailAlreadyExists: false };
  }

  // Supabase silently "succeeds" for an already-confirmed email — the identities
  // array is empty and no confirmation email is actually sent.
  const identities = data.user?.identities ?? [];
  if (data.user && identities.length === 0) {
    return {
      error: null,
      needsConfirmation: false,
      emailAlreadyExists: true,
    };
  }

  return {
    error: null,
    needsConfirmation: !data.session,
    emailAlreadyExists: false,
  };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Reads the cached session — no network call, instant. */
export async function getSession() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (err) {
    console.warn('[Balancio] getSession error:', err);
    return null;
  }
}

/**
 * Sends a password-reset email. The link redirects back through /auth/callback
 * which exchanges the recovery code for a session automatically.
 */
export async function resetPasswordForEmail(
  email: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error ? mapSupabaseError(error.message) : null };
}

/** Resends the confirmation email for an unconfirmed account. */
export async function resendConfirmation(
  email: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  return { error: error ? mapSupabaseError(error.message) : null };
}

// ── Sync ─────────────────────────────────────────────────────────────────────

export async function pushToCloud(
  friends: Friend[],
  transactions: Transaction[],
  userId: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Not configured' };

  const friendRows = friends.map(({ id, name, notes, createdAt, updatedAt }) => ({
    id,
    user_id: userId,
    name,
    notes: notes ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
  }));

  const txnRows = transactions.map(({ id, friendId, type, amount, date, paymentMethod, note, createdAt }) => ({
    id,
    user_id: userId,
    friend_id: friendId,
    type,
    amount,
    date,
    payment_method: paymentMethod,
    note: note ?? null,
    created_at: createdAt,
  }));

  const [fr, tr] = await Promise.all([
    supabase.from('friends').upsert(friendRows, { onConflict: 'id' }),
    supabase.from('transactions').upsert(txnRows, { onConflict: 'id' }),
  ]);

  if (fr.error) return { error: fr.error.message };
  if (tr.error) return { error: tr.error.message };
  return { error: null };
}

export async function pullFromCloud(
  userId: string
): Promise<{ friends: Friend[]; transactions: Transaction[] } | null> {
  if (!supabase) return null;

  const [fr, tr] = await Promise.all([
    supabase.from('friends').select('*').eq('user_id', userId),
    supabase.from('transactions').select('*').eq('user_id', userId),
  ]);

  if (fr.error || tr.error) {
    console.error('[Balancio] pullFromCloud DB error:', fr.error ?? tr.error);
    return null;
  }

  const friends: Friend[] = (fr.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const transactions: Transaction[] = (tr.data ?? []).map((r) => ({
    id: r.id,
    friendId: r.friend_id,
    type: r.type,
    amount: r.amount,
    date: r.date,
    paymentMethod: r.payment_method,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  }));

  return { friends, transactions };
}

