'use client';

/**
 * ClientProvider — mounts once in the root layout.
 *
 * Responsibilities:
 * 1. Subscribes to Supabase auth state changes.
 * 2. On sign-in / initial session:
 *    - If cloud has data → replace local store with cloud data (e.g. returning user, different device)
 *    - If cloud is empty → new account; migrate local guest data up to cloud.
 * 3. On sign-out → clear all local state so the next user starts fresh.
 * 4. Auto-pushes to cloud (debounced 2s) whenever friends/transactions change while signed in.
 */

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, pullFromCloud, pushToCloud } from '@/lib/supabase';
import { useStore } from '@/stores/useStore';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { replaceAll, clearAll, setAuthLoaded } = useStore();
  const friends = useStore((s) => s.friends);
  const transactions = useStore((s) => s.transactions);

  // Ref so the auto-sync effect always sees the current userId without
  // needing to be in the dependency array (avoids re-subscribing).
  const userIdRef = useRef<string | null>(null);

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userId = session?.user?.id ?? null;

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && userId) {
        userIdRef.current = userId;
        useStore.getState().setUser({ id: userId, email: session?.user?.email ?? '' });
        // Mark auth as loaded immediately so the UI never hangs on a spinner.
        // Persisted data (from localStorage via Zustand) is already displayed;
        // the cloud fetch below will refresh it in the background.
        setAuthLoaded(true);

        // Fetch cloud data in the background — with a 10-second timeout so we
        // never block if Supabase is unreachable.
        const fetchData = async () => {
          try {
            const timeout = new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 10_000)
            );
            const cloudData = await Promise.race([pullFromCloud(userId), timeout]);
            if (cloudData && (cloudData.friends.length > 0 || cloudData.transactions.length > 0)) {
              replaceAll(cloudData.friends, cloudData.transactions);
            } else if (!cloudData) {
              console.warn('[Balancio] Cloud fetch timed-out or returned an error.');
            }
          } catch (err) {
            console.error('[Balancio] Sync on sign-in failed:', err);
          }
        };
        fetchData();

        // Check if we arrived via a password reset link (hash contains type=recovery)
        const isRecovery = window.location.hash.includes('type=recovery') || event === 'PASSWORD_RECOVERY';

        if (isRecovery) {
          router.replace('/settings?mode=reset');
        }
      }

      if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        clearAll(); // Clears Zustand memory (including user)
        setAuthLoaded(true);
      }

      if (event === 'INITIAL_SESSION' && !userId) {
        clearAll();
        setAuthLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auto-sync mutations to cloud ───────────────────────────────────────────
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId || !supabase) return;

    const timer = setTimeout(async () => {
      const { friends: f, transactions: t } = useStore.getState();
      const res = await pushToCloud(f, t, userId);
      if (res.error) {
        console.error('[Balancio] Auto-sync Supabase err:', res.error);
      }
    }, 2000);

    return () => clearTimeout(timer);
    // React to any mutation in friends or transactions.
  }, [friends, transactions]);

  return <>{children}</>;
}
