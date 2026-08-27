'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatBarProps {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
}

function StatBar({
  label,
  value,
  displayValue,
  color = '#2b5fa8',
  size = 'md',
  className,
}: StatBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const barHeight = size === 'sm' ? '4px' : '6px';
  const shown = displayValue ?? `${clampedValue}%`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#6b7480', fontWeight: 500 }}>{shown}</span>
      </div>
      <div
        className="w-full overflow-hidden"
        style={{ height: barHeight, borderRadius: '999px', background: '#eef0f2' }}
      >
        <div
          style={{
            height: '100%',
            width: `${clampedValue}%`,
            background: color,
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

export { StatBar };
