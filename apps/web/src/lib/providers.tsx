'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't retry on 401/403 — those mean the user isn't authenticated
        retry: (failureCount, error) => {
          const msg = (error as Error)?.message ?? '';
          if (msg.includes('401') || msg.includes('403')) return false;
          return failureCount < 1;
        },
        staleTime: 30_000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new client
    return makeQueryClient();
  }
  // Browser: reuse the same client across renders
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
