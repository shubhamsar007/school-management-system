'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Wraps any page tree that requires authentication.
 * Reads the access token from localStorage synchronously —
 * if absent, immediately redirects to /login with no flash.
 *
 * Used in the (app) layout so every app route is protected.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Synchronous check — localStorage reads are instant, no useEffect needed.
  // Returns false during SSR (typeof window === 'undefined') which is harmless
  // because Next.js re-runs on the client before painting.
  const isAuthed = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  }, []);

  React.useEffect(() => {
    if (!isAuthed) {
      router.replace('/login');
    }
  }, [isAuthed, router]);

  // Don't render anything until we've confirmed auth.
  // This prevents a flash of the app content before the redirect fires.
  if (!isAuthed) return null;

  return <>{children}</>;
}
