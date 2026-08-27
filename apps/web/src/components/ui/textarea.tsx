'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
  rows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, rows = 3, disabled, id, ...props }, ref) => {
    const textareaId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            style={{ fontSize: '12px', fontWeight: 500, color: '#14181c', marginBottom: '1px' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-[6px] border border-[#d7dce1] bg-white text-[13px] text-[#14181c] placeholder:text-[#a2aab3] transition-colors outline-none resize-y',
            'focus:border-[#2b5fa8] focus:ring-2 focus:ring-[#2b5fa8]/20',
            error && 'border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e]/20',
            disabled && 'bg-[#fafbfc] text-[#a2aab3] cursor-not-allowed',
            className,
          )}
          style={{ padding: '8px 10px', minHeight: '80px' }}
          {...props}
        />
        {error && (
          <p style={{ fontSize: '11px', color: '#b3261e', marginTop: '2px' }}>{error}</p>
        )}
        {!error && hint && (
          <p style={{ fontSize: '11px', color: '#8a929b', marginTop: '2px' }}>{hint}</p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
