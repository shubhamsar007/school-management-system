'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function SearchBar({ placeholder = 'Search…', value, onChange, className }: SearchBarProps) {
  return (
    <div
      className={cn('relative flex items-center', className)}
      style={{ height: 28 }}
    >
      {/* Circle search icon matching design */}
      <div
        className="absolute pointer-events-none"
        style={{ left: 9, width: 10, height: 10, border: '1.5px solid #a6a89f', borderRadius: '50%' }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full"
        style={{
          borderRadius: 6,
          border: '1px solid #ded9cc',
          background: '#fffdf7',
          paddingLeft: 28,
          paddingRight: 10,
          fontSize: '12px',
          color: '#23282a',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#5d7f6b'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#ded9cc'; }}
      />
    </div>
  );
}

export { SearchBar };
