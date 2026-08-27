'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#eef0f2]', className)}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-white border border-[#e6e8eb] rounded-xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(20,24,28,0.04)' }}>
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-4 border-b border-[#e6e8eb]"
        style={{ height: '44px', background: '#fafbfc' }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={10} className="flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4 border-b border-[#eef0f2] last:border-0"
          style={{ height: '52px' }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height={12}
              className={cn('flex-1', colIdx !== 0 && 'opacity-70')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#e6e8eb] rounded-xl p-[18px]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <Skeleton height={10} width={80} className="mb-3" />
          <Skeleton height={28} width={60} className="mb-3" />
          <Skeleton height={10} width={100} />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, TableSkeleton, KpiSkeleton };
