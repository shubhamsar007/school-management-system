'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Wraps any page tree that requires authentication.
 *
 * The `mounted` flag ensures SSR and the initial client hydration render
 * both return null, eliminating the server/client HTML mismatch that
 * arises from reading localStorage (which is undefined on the server).
 * After the first effect fires the real auth state is known.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const authed = !!localStorage.getItem('access_token');
    setIsAuthed(authed);
    setMounted(true);
    if (!authed) {
      router.replace('/login');
    }
  }, [router]);

  // SSR + initial hydration render: return null so server HTML matches client.
  if (!mounted) return null;
  if (!isAuthed) return null;

  return <>{children}</>;
}
