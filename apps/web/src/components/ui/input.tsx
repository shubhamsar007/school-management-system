'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, leftIcon, rightIcon, disabled, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '12px', fontWeight: 500, color: '#14181c', marginBottom: '1px' }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-0 flex items-center justify-center text-[#8a929b]"
              style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-[6px] border border-[#d7dce1] bg-white text-[13px] text-[#14181c] placeholder:text-[#a2aab3] transition-colors outline-none',
              'focus:border-[#2b5fa8] focus:ring-2 focus:ring-[#2b5fa8]/20',
              error && 'border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e]/20',
              disabled && 'bg-[#fafbfc] text-[#a2aab3] cursor-not-allowed',
              leftIcon ? 'pl-[34px]' : 'pl-[10px]',
              rightIcon ? 'pr-[34px]' : 'pr-[10px]',
              className,
            )}
            style={{ height: '36px' }}
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute flex items-center justify-center text-[#8a929b]"
              style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              {rightIcon}
            </span>
          )}
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
Input.displayName = 'Input';

export { Input };
