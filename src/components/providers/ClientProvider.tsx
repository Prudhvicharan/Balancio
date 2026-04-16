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
import { supabase, pullFromCloud, pushToCloud } from '@/lib/supabase';
import { useStore } from '@/stores/useStore';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { replaceAll, clearAll } = useStore();
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

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && userId) {
        userIdRef.current = userId;

        try {
          const cloudData = await pullFromCloud(userId);
          const hasCloudData =
            cloudData &&
            (cloudData.friends.length > 0 || cloudData.transactions.length > 0);

          if (hasCloudData) {
            // Returning user or different device — load their cloud data.
            replaceAll(cloudData.friends, cloudData.transactions);
          } else {
            // Brand-new account — migrate any existing local data to the cloud.
            const { friends: localFriends, transactions: localTxns } =
              useStore.getState();
            if (localFriends.length > 0 || localTxns.length > 0) {
              await pushToCloud(localFriends, localTxns, userId);
            }
          }

          localStorage.setItem('balancio-last-synced', new Date().toISOString());
        } catch (err) {
          console.error('[Balancio] Sync on sign-in failed:', err);
        }
      }

      if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        // Full reset — the next user (or guest) starts with a clean slate.
        clearAll();
        localStorage.removeItem('balancio-last-synced');
      }
    });

    return () => subscription.unsubscribe();
    // replaceAll / clearAll are stable Zustand actions — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-sync mutations to cloud ───────────────────────────────────────────
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId || !supabase) return;

    const timer = setTimeout(() => {
      const { friends: f, transactions: t } = useStore.getState();
      pushToCloud(f, t, userId)
        .then(() =>
          localStorage.setItem('balancio-last-synced', new Date().toISOString())
        )
        .catch((err) => console.error('[Balancio] Auto-sync failed:', err));
    }, 2000);

    return () => clearTimeout(timer);
    // React to any mutation in friends or transactions.
  }, [friends, transactions]);

  return <>{children}</>;
}
