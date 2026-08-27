'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

function FormField({ label, hint, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label
          style={{ fontSize: '12px', fontWeight: 500, color: '#14181c' }}
        >
          {label}
          {required && <span style={{ color: '#b3261e' }}> *</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs" style={{ color: '#b3261e' }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: '#8a929b' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export { FormField };
