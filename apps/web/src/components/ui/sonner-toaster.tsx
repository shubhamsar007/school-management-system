'use client';

import * as React from 'react';
import { Toaster } from 'sonner';

// Client-only wrapper so sonner's ARIA live region <section> is never emitted
// in server HTML (which would cause a hydration mismatch on the client).
export function SonnerToaster() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <Toaster richColors position="top-right" />;
}
