'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
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
      style={{ height: 36 }}
    >
      <Search
        size={14}
        className="absolute left-2.5 pointer-events-none"
        style={{ color: '#8a929b' }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-md border border-[#d7dce1] bg-white pl-8 pr-3 text-[13px] text-[#14181c] placeholder-[#a2aab3] outline-none focus:border-[#2b5fa8] focus:ring-1 focus:ring-[#2b5fa8] transition-colors"
      />
    </div>
  );
}

export { SearchBar };
