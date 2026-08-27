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

  // Generate page numbers to show (max 7 buttons with ellipsis)
  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn('flex items-center justify-between gap-4 flex-wrap', className)}>
      <p style={{ fontSize: '13px', color: '#6b7480' }}>
        Showing <span className="font-medium text-[#14181c]">{from}</span> to{' '}
        <span className="font-medium text-[#14181c]">{to}</span> of{' '}
        <span className="font-medium text-[#14181c]">{total}</span> entries
      </p>

      <div className="flex items-center gap-3">
        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '13px', color: '#6b7480' }}>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-8 rounded border border-[#e6e8eb] bg-white px-2 text-[13px] text-[#14181c] focus:outline-none focus:border-[#2b5fa8]"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#e6e8eb] bg-white text-[#6b7480] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="flex h-8 w-8 items-center justify-center text-[13px] text-[#8a929b]">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded border text-[13px] font-medium transition-colors',
                  p === page
                    ? 'border-[#2b5fa8] bg-[#2b5fa8] text-white'
                    : 'border-[#e6e8eb] bg-white text-[#14181c] hover:bg-[#f2f4f6]'
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#e6e8eb] bg-white text-[#6b7480] hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { Pagination };
