'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  const btn = (active: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 28,
    height: 28,
    borderRadius: 6,
    border: active ? '1px solid #5d7f6b' : '1px solid #ded9cc',
    background: active ? '#5d7f6b' : '#fffdf7',
    color: active ? '#fdfcf8' : '#6d746e',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  });

  return (
    <div className={cn('flex items-center justify-between gap-4 flex-wrap', className)}>
      <p style={{ fontSize: '12px', color: '#8d938d' }}>
        Showing <span style={{ fontWeight: 600, color: '#2c322f' }}>{from}</span> –{' '}
        <span style={{ fontWeight: 600, color: '#2c322f' }}>{to}</span> of{' '}
        <span style={{ fontWeight: 600, color: '#2c322f' }}>{total}</span>
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '12px', color: '#8d938d' }}>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            style={{
              height: 28,
              borderRadius: 6,
              border: '1px solid #ded9cc',
              background: '#fffdf7',
              padding: '0 8px',
              fontSize: 12,
              color: '#2c322f',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={{ ...btn(false), opacity: page <= 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={13} />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`e-${idx}`} style={{ width: 28, textAlign: 'center', fontSize: 12, color: '#8d938d' }}>…</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p as number)} style={btn(p === page)}>
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={{ ...btn(false), opacity: page >= totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { Pagination };
