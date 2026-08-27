'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  hint?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, hint, options, placeholder, disabled, id, ...props }, ref) => {
    const selectId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            style={{ fontSize: '12px', fontWeight: 500, color: '#14181c', marginBottom: '1px' }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'w-full appearance-none rounded-[6px] border border-[#d7dce1] bg-white px-[10px] pr-[34px] text-[13px] text-[#14181c] transition-colors outline-none cursor-pointer',
              'focus:border-[#2b5fa8] focus:ring-2 focus:ring-[#2b5fa8]/20',
              error && 'border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e]/20',
              disabled && 'bg-[#fafbfc] text-[#a2aab3] cursor-not-allowed',
              className,
            )}
            style={{ height: '36px' }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute flex items-center justify-center text-[#8a929b]"
            style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronDown size={14} />
          </span>
        </div>
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
Select.displayName = 'Select';

export { Select };
