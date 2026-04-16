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
        useStore.getState().setUser({ id: userId, email: session.user.email ?? '' });

        try {
          const cloudData = await pullFromCloud(userId);
          if (cloudData) {
            replaceAll(cloudData.friends, cloudData.transactions);
          }
        } catch (err) {
          console.error('[Balancio] Sync on sign-in failed:', err);
        }
      }

      if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        clearAll(); // Clears Zustand memory (including user)
        if (pathname !== '/settings') {
          router.push('/settings');
        }
      }

      if (event === 'INITIAL_SESSION' && !userId) {
        if (pathname !== '/settings') {
          router.push('/settings');
        }
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  // ── Auto-sync mutations to cloud ───────────────────────────────────────────
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId || !supabase) return;

    const timer = setTimeout(() => {
      const { friends: f, transactions: t } = useStore.getState();
      pushToCloud(f, t, userId).catch((err) =>
        console.error('[Balancio] Auto-sync failed:', err)
      );
    }, 2000);

    return () => clearTimeout(timer);
    // React to any mutation in friends or transactions.
  }, [friends, transactions]);

  return <>{children}</>;
}
