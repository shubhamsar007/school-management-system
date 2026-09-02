'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = 'Back', className }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn('inline-flex items-center gap-1.5 hover:underline outline-none', className)}
      style={{ fontSize: '13px', color: '#6b7480', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <ChevronLeft size={14} />
      {label}
    </button>
  );
}
