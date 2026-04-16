'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || !supabase) {
      router.replace('/');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        // On error go to home — the settings auth form is now part of the account page
        console.error('[Balancio] Auth callback error:', error.message);
        router.replace(`/?auth_error=${encodeURIComponent(error.message)}`);
      } else {
        // Session is established. ClientProvider in layout.tsx will detect
        // the SIGNED_IN event via onAuthStateChange and handle data sync.
        router.replace('/');
      }
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
      {/* Spinner */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(124,106,247,0.2), rgba(52,211,153,0.1))',
          border: '1px solid rgba(124,106,247,0.3)',
        }}
      >
        <svg className="animate-spin w-6 h-6 text-[var(--accent-light)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
