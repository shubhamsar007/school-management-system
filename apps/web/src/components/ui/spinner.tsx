'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 12,
  md: 20,
  lg: 32,
} as const;

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Spinner({ size = 'md', className }: SpinnerProps) {
  const px = SIZES[size];
  const r = (px - 4) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      className={cn('animate-spin', className)}
      aria-label="Loading"
      role="status"
    >
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        stroke="currentColor"
        strokeOpacity={0.2}
        strokeWidth={2}
      />
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/70">
      <Spinner size="lg" className="text-[#2b5fa8]" />
      <p style={{ fontSize: '13px', color: '#8a929b' }}>Loading…</p>
    </div>
  );
}

export { Spinner, PageSpinner };
